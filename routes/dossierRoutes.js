// --------------routes/dossier------------------------//
const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossier');

//-------Rechercher les dossier debiteur avec différents paramètre -----------//
router.get('/dossiers/:sitename', dossierController.getDossiers);


module.exports = router;