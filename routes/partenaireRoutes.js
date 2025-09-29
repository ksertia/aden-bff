// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const partenaireController = require('../controllers/partenaire');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/partenaires/:sitename', partenaireController.getPartenaires);

module.exports = router;
