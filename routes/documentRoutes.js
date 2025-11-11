// ==============================================
//  ROUTES : Gestion des documents Alfresco
// ==============================================

const express = require('express');
const multer = require('multer');
const router = express.Router();
const documentController = require('../controllers/document');

//  Configuration Multer (stockage temporaire des fichiers uploadés)
const upload = multer({ dest: 'uploads/' });

// ==============================================
//  ROUTES DISPONIBLES
// ==============================================

// Upload d’un document vers Alfresco
router.post('/documents/upload', upload.single('filedata'), documentController.uploadDocument);

// Route de suppression
router.delete('/delete', documentController.deleteDocument);

// //  Association du document à un objet (ex. entreprise, dossier, etc.)
// router.post('/documents/associate', documentController.associateDocument);

//  Récupération du contenu d’un document par son nodeId Alfresco
router.get('/documents/:nodeId/content', documentController.getDocumentContent);

// ==============================================
//  EXPORT DES ROUTES
// ==============================================
module.exports = router;
