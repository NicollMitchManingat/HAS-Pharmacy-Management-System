const pharmacyService = require('../services/pharmacyService');

function getToken(req) {
    return req.headers.authorization?.split(' ')[1];
}


exports.getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const token = getToken(req);
        const prescriptions = await pharmacyService.getPatientPrescriptions(patientId, token);
        
        res.status(200).json({
            success: true,
            message: "Patient prescription history retrieved successfully",
            data: prescriptions
        });
    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        });
    }
};


exports.getConsultationPrescriptions = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.query.patientId;
        if (!patientId) throw { status: 400, message: "patientId query parameter is required" };
        const token = getToken(req);
        const prescription = await pharmacyService.getConsultationPrescriptions(appointmentId, patientId, token);
        
        res.status(200).json({
            success: true,
            message: "Consultation prescription retrieved successfully",
            data: prescription
        });
    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false, 
            error: error.message 
        });
    }
};


exports.searchMedicines = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) throw { status: 400, message: "Search query parameter is required" };

        const medicines = await pharmacyService.searchAvailableMedicines(query);
        
        res.status(200).json({
            success: true,
            message: "Medicines retrieved successfully",
            data: medicines
        });
    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false, 
            error: error.message 
        });
    }
};


exports.createPharmacyOrder = async (req, res) => {
    try {
        const modernPayload = req.body;
        const newOrder = await pharmacyService.processNewOrder(modernPayload);
        
        res.status(201).json({
            success: true,
            message: "Pharmacy order created successfully",
            data: newOrder
        });
    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false, 
            error: error.message 
        });
    }
};


exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, recipientEmail } = req.body;
        const token = getToken(req);
        const updatedData = await pharmacyService.updateStatusAndNotify(orderId, status, recipientEmail, token);
        
        res.status(200).json({
            success: true,
            message: "Order status updated and notification triggered",
            data: updatedData
        });
    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false, 
            error: error.message 
        });
    }
};