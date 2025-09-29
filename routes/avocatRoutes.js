// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const avocatController = require('../controllers/avocat');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/avocats/:sitename', avocatController.getAvocats);

module.exports = router;
