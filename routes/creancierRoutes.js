// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const creancierController = require('../controllers/creancier');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/creanciers/:sitename', creancierController.getCreanciers);
router.get('/creanciers/:sitename/:creances', creancierController.getCreances);

module.exports = router;
