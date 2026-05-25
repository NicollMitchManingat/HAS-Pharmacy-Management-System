const ADAPTER_URL = process.env.HAS_ADAPTER_URL;

function parseRx(rxString) {
  if (!rxString || typeof rxString !== 'string') return [];
  return rxString.split(',').map(item => item.trim()).filter(Boolean).map(item => ({
    name: item,
    dosage: null
  }));
}

exports.fetchPatientPrescriptions = async (patientId, token) => {
  try {
    const response = await fetch(`${ADAPTER_URL}/consultations/history/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Adapter returned " + response.status);

    const body = await response.json();
    const consultations = body.data || [];

    return consultations.map(consultation => ({
      consultationId: consultation._id,
      appointmentId: consultation.appointmentId,
      patientId: consultation.patientId,
      clinicalFinding: consultation.clinicalFinding,
      medicines: parseRx(consultation.rx),
      doctorNotes: consultation.doctorNotes,
      dateIssued: consultation.createdAt
    }));
  } catch (error) {
    throw { status: 503, message: "Adapter Connectivity Error: " + error.message };
  }
};

exports.fetchConsultationPrescriptions = async (appointmentId, patientId, token) => {
  try {
    const response = await fetch(`${ADAPTER_URL}/consultations/history/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Adapter returned " + response.status);

    const body = await response.json();
    const consultations = body.data || [];

    const match = consultations.find(c => c.appointmentId === appointmentId);
    if (!match) throw { status: 404, message: "No consultation found for this appointment" };

    return {
      consultationId: match._id,
      appointmentId: match.appointmentId,
      patientId: match.patientId,
      clinicalFinding: match.clinicalFinding,
      medicines: parseRx(match.rx),
      doctorNotes: match.doctorNotes,
      dateIssued: match.createdAt
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 503, message: "Adapter Connectivity Error: " + error.message };
  }
};