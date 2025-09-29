// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const cedantController = require('../controllers/cedant');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/cedants/:sitename', cedantController.getCedants);

module.exports = router;
