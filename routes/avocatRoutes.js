// routes/avocatRoutes.js
const express = require('express');
const router = express.Router();
const avocatController = require('../controllers/avocat');  // Importer le contrôleur debiteur.js

// Route pour récupérer les avocats
router.get('/avocats/:sitename', avocatController.getAvocats);
router.get('/avocats/:sitename/:avocatId', avocatController.getAvocats);



module.exports = router;
