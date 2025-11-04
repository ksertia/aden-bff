// ==============================================
// 📦 CONTROLLER : Gestion des documents Alfresco
// ==============================================

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

// ======================
// ⚙️ Variables d'environnement
// ======================
const ALFRESCO_UPLOAD_URL = process.env.ALFRESCO_UPLOAD_URL;
const ALFRESCO_USERNAME = process.env.ALFRESCO_USERNAME;
const ALFRESCO_PASSWORD = process.env.ALFRESCO_PASSWORD;
const WS_METIER_URL = process.env.WS_METIER_URL;

// ==============================================
// 📁 UPLOAD DOCUMENT VERS ALFRESCO (FINAL)
// ==============================================
// exports.uploadDocument = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "Aucun fichier uploadé" });
//     }

//     const { objetNodeId, fieldName, typeDocument } = req.query;
//     if (!objetNodeId || !fieldName || !typeDocument) {
//       return res.status(400).json({ message: "objetNodeId, fieldName et typeDocument sont requis dans les params" });
//     }

//     // const fileName = req.file.originalname;
//     // const tmpPath = `/tmp/${fileName}`; 
//     const originalFileName = req.file.originalname;
//     const fileExtension = originalFileName.split('.').pop().toLowerCase();
//     const tmpPath = `/tmp/${originalFileName}`;

//     // 🔹 Renommer le fichier temporairement pour conserver le nom exact
//     fs.renameSync(req.file.path, tmpPath);

//     // 🔹 Prépare le form-data
//     // const form = new FormData();
//     // form.append("filedata", fs.createReadStream(tmpPath));
//     // form.append("nodeType", "cm:content");
//     // form.append("name", fileName); 
//     const form = new FormData();
//     form.append("filedata", fs.createReadStream(tmpPath));
//     form.append("nodeType", "cm:content");
//     form.append("name", originalFileName); // ✅ Garder le nom COMPLET avec extension


//     // 🔹 URL Alfresco avec query params
//     const alfrescoUrl = `${ALFRESCO_UPLOAD_URL}?objetNodeId=${objetNodeId}&fieldName=${fieldName}&typeDocument=${typeDocument}`;
//      console.log('📤 Envoi à Alfresco:', {
//       fileName: originalFileName,
//       extension: fileExtension,
//       alfrescoUrl: alfrescoUrl
//     });

//     // 🔹 Envoi vers Alfresco
//     const uploadResponse = await axios.post(alfrescoUrl, form, {
//       headers: {
//         ...form.getHeaders(),
//         Authorization: `Basic ${Buffer.from(`${ALFRESCO_USERNAME}:${ALFRESCO_PASSWORD}`).toString("base64")}`,
//       },
//     });

//     // 🔹 Supprime le fichier temporaire
//     fs.unlinkSync(tmpPath);

//     // 🔹 Récupère le fichier créé depuis Alfresco
//     const alfrescoFile = uploadResponse.data.files[0];
//     console.log('📥 Réponse Alfresco:', alfrescoFile);

//     // 🔹 CORRECTION: S'assurer que le fileName inclut l'extension
//     const finalFileName = alfrescoFile.fileName || originalFileName;
    
//     // Si Alfresco a retiré l'extension, on la rajoute
//     let correctedFileName = finalFileName;
//     if (!finalFileName.includes('.') && fileExtension) {
//       correctedFileName = `${finalFileName}.${fileExtension}`;
//     }

//     // 🔹 Reformate la réponse pour le front-end
//     const formattedResponse = {
//       fieldName,
//       // files: [
//       //   {
//       //     documentNodeId: alfrescoFile.documentNodeId,
//       //     fileName: fileName,
//       //     fileExtension: fileName.split(".").pop().toLowerCase(),
//       //     titre: alfrescoFile.titre || "",
//       //     typeDocument,
//       //   },
//       // ],
//         files: [
//         {
//           documentNodeId: alfrescoFile.documentNodeId,
//           fileName: correctedFileName, // ⬅️ CORRECTION ICI
//           fileExtension: fileExtension,
//           titre: alfrescoFile.titre || "",
//           typeDocument,
//         },
//       ],
//       isListField: true,
//       site: "portail-recouvrement",
//       status: "success",
//       typeObjet: "dossier",
//     };

//     return res.status(200).json(formattedResponse);

//   } catch (error) {
//     console.error("❌ Erreur upload :", error.response?.data || error.message);
//     return res.status(500).json({
//       message: "Erreur lors de l'upload du document",
//       error: error.response?.data || error.message,
//     });
//   }
// };
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }

    const { objetNodeId, fieldName, typeDocument } = req.query;
    if (!objetNodeId || !fieldName || !typeDocument) {
      return res.status(400).json({ message: "objetNodeId, fieldName et typeDocument sont requis dans les params" });
    }

    const originalFileName = req.file.originalname;
    const fileExtension = originalFileName.split('.').pop().toLowerCase();
    
    // 🔥 CORRECTION: Utiliser le chemin TEMPORAIRE CORRECT
    const tmpDir = require('os').tmpdir(); // Dossier temp système
    const tmpPath = require('path').join(tmpDir, originalFileName);

    console.log('📁 Chemins:', {
      source: req.file.path,
      destination: tmpPath
    });

    // 🔥 Vérifier si le fichier source existe
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({ message: "Fichier source introuvable" });
    }

    // Copier le fichier vers le dossier temp système
    fs.copyFileSync(req.file.path, tmpPath);
    
    // Supprimer le fichier original d'upload
    fs.unlinkSync(req.file.path);

    // 🔥 SOLUTION SIMPLIFIÉE: Utiliser directement le nom original
    const form = new FormData();
    form.append("filedata", fs.createReadStream(tmpPath));
    form.append("nodeType", "cm:content");
    form.append("name", originalFileName); // Nom original avec extension

    const alfrescoUrl = `${ALFRESCO_UPLOAD_URL}?objetNodeId=${objetNodeId}&fieldName=${fieldName}&typeDocument=${typeDocument}`;

    console.log('📤 Envoi à Alfresco avec nom:', originalFileName);

    const uploadResponse = await axios.post(alfrescoUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Basic ${Buffer.from(`${ALFRESCO_USERNAME}:${ALFRESCO_PASSWORD}`).toString("base64")}`,
      },
    });

    // Nettoyer le fichier temporaire
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }

    const alfrescoFile = uploadResponse.data.files[0];

    console.log('📥 Réponse Alfresco:', alfrescoFile);

    // 🔥 Retourner TOUJOURS le nom original
    const formattedResponse = {
      fieldName,
      files: [
        {
          documentNodeId: alfrescoFile.documentNodeId,
          fileName: originalFileName, // 🔥 NOM ORIGINAL GARANTI
          fileExtension: fileExtension,
          titre: alfrescoFile.titre || "",
          typeDocument,
          mimeType: req.file.mimetype
        },
      ],
      isListField: true,
      site: "portail-recouvrement",
      status: "success",
      typeObjet: "dossier",
    };

    console.log('✅ Upload réussi:', formattedResponse);

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error("❌ Erreur upload :", error);
    
    // Nettoyer les fichiers temporaires en cas d'erreur
    if (tmpPath && fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    
    return res.status(500).json({
      message: "Erreur lors de l'upload du document",
      error: error.message,
    });
  }
};




// ==============================================
// 🗑️ SUPPRESSION D'UN DOCUMENT DANS ALFRESCO
// ==============================================
exports.deleteDocument = async (req, res) => {
  try {
    const { documentNodeId } = req.query;
    if (!documentNodeId) {
      return res.status(400).json({ message: "Le paramètre documentNodeId est requis" });
    }

    // 🔗 Construction de l'URL du service Alfresco
    const alfrescoDeleteUrl = `${process.env.WS_METIER_URL}/alfresco/service/aden/file/objet?documentNodeId=${documentNodeId}`;

    // 📡 Envoi de la requête DELETE vers Alfresco
    const response = await axios.delete(alfrescoDeleteUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.ALFRESCO_USERNAME}:${process.env.ALFRESCO_PASSWORD}`).toString("base64")}`,
      },
    });

    // ✅ Reformater la réponse pour le front-end
    return res.status(200).json({
      code: response.data.code || 200,
      data: response.data.data,
      details: response.data.details || `Fichier supprimé avec succès`,
      message: response.data.message || "OK",
    });

  } catch (error) {
    console.error("❌ Erreur suppression :", error.response?.data || error.message);
    return res.status(500).json({
      message: "Erreur lors de la suppression du document",
      error: error.response?.data || error.message,
    });
  }
};


// ==============================================
// 📄 3️⃣ RÉCUPÉRER LE CONTENU D'UN DOCUMENT PAR NODEID
// ==============================================
exports.getDocumentContent = async (req, res) => {
  try {
    const { nodeId } = req.params;

    // 🔗 URL complète du contenu du document Alfresco
    const url = `${WS_METIER_URL}/alfresco/service/api/node/content/workspace/SpacesStore/${nodeId}`;

    // 📡 Requête HTTP GET avec authentification Basic
    const response = await axios.get(url, {
      responseType: 'arraybuffer', // Pour recevoir du binaire
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ALFRESCO_USERNAME}:${ALFRESCO_PASSWORD}`).toString('base64')}`
      }
    });

    // 🔄 Transmet directement le fichier téléchargé avec le bon type MIME
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(response.data);

  } catch (error) {
    console.error("❌ Erreur récupération contenu :", error.response?.data || error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération du contenu du document",
      error: error.response?.data || error.message,
    });
  }
};