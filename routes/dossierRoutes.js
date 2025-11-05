// --------------routes/dossier------------------------//
const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossier');

// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });

//-------Rechercher les dossier debiteur avec différents paramètre -----------//
router.get('/dossiers/:sitename', dossierController.getDossiers);
// router.post('/dossiers/:sitename/uploader', upload.single('file'), dossierController.uploadFile);


module.exports = router;