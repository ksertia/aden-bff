// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const huissierController = require('../controllers/huissier');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/huissiers/:sitename', huissierController.getHuissiers);

module.exports = router;
