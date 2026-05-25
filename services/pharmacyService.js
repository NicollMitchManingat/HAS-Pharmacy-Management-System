const supabase = require('../HAS---Pharmacy-Management-System/config/db');
const pharmacyAdapter = require('../HAS---Pharmacy-Management-System/adapters/pharmacyAdapter');
const eventTriggerService = require('./eventTriggerService');


exports.getPatientPrescriptions = async (patientId, token) => {
    return await pharmacyAdapter.fetchPatientPrescriptions(patientId, token);
};


exports.getConsultationPrescriptions = async (appointmentId, patientId, token) => {
    return await pharmacyAdapter.fetchConsultationPrescriptions(appointmentId, patientId, token);
};


exports.searchAvailableMedicines = async (searchQuery) => {
    const q = `%${searchQuery.toLowerCase()}%`;
    const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .or(`name.ilike.${q},generic_name.ilike.${q},category.ilike.${q}`);

    if (error) throw { status: 500, message: "Failed to search medicines: " + error.message };
    return data;
};


exports.processNewOrder = async (modernPayload) => {
    if (!modernPayload.patientId || !modernPayload.appointmentId || !modernPayload.medicines) {
        throw { status: 400, message: "Missing required order fields" };
    }

    const { data: localOrder, error: localError } = await supabase
        .from('pharmacy_orders')
        .insert([{
            patient_id: modernPayload.patientId,
            appointment_id: modernPayload.appointmentId,
            medicines: modernPayload.medicines,
            status: modernPayload.status || 'Pending'
        }])
        .select()
        .single();

    if (localError) throw { status: 500, message: "Failed to save order: " + localError.message };

    return localOrder;
};


exports.updateStatusAndNotify = async (orderId, newStatus, recipientEmail, token) => {
    const { data: updatedLocal, error } = await supabase
        .from('pharmacy_orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single();

    if (error || !updatedLocal) throw { status: 404, message: "Order not found or update failed" };

    if (recipientEmail) {
        await eventTriggerService.sendNotification({
            recipientEmail,
            subject: `Pharmacy Order #${orderId} — ${newStatus}`,
            message: `Your medication order status is now: ${newStatus}.`
        }, token);
    }

    return updatedLocal;
};