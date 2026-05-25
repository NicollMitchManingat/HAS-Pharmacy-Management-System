require('dotenv').config();
const express = require('express');
const pharmacyRoutes = require('./routes/pharmacyRoutes.js');

const app = express();

app.use(express.json());

// Routes
app.use('/api/pharmacy', pharmacyRoutes);

const PORT = process.env.PORT || 6767;
app.listen(PORT, () => {
    console.log(`Pharmacy Service running on port ${PORT}`);
});