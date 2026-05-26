const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/prescriptions/consultation/:appointmentId', pharmacyController.getConsultationPrescriptions);
router.get('/prescriptions/patient/:patientId', pharmacyController.getPatientPrescriptions);
router.get('/medicines/search', pharmacyController.searchMedicines);
router.post('/orders/create', roleMiddleware(['staff', 'doctor', 'admin']), pharmacyController.createPharmacyOrder);
router.put('/orders/:orderId/status', roleMiddleware(['staff', 'admin']), pharmacyController.updateOrderStatus);

module.exports = router;