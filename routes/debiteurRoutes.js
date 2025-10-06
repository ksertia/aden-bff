// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const debiteurController = require('../controllers/debiteur');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/debiteurs/:sitename', debiteurController.getDebiteurs);
// Route pour récupérer un débiteur par ID
// router.get('/debiteurs/:sitename/:debiteurId', debiteurController.getDebiteurs);

//-------Rechercher les dossier debiteur avec différents paramètre -----------//
router.get('/debiteurs/:sitename/:dossiers', debiteurController.getDossiers);



module.exports = router;
