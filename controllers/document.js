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
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }

    const { objetNodeId, fieldName, typeDocument } = req.query;
    if (!objetNodeId || !fieldName || !typeDocument) {
      return res.status(400).json({ message: "objetNodeId, fieldName et typeDocument sont requis dans les params" });
    }

    const fileName = req.file.originalname;
    const tmpPath = `/tmp/${fileName}`; // chemin temporaire sur le serveur

    // 🔹 Renommer le fichier temporairement pour conserver le nom exact
    fs.renameSync(req.file.path, tmpPath);

    // 🔹 Prépare le form-data
    const form = new FormData();
    form.append("filedata", fs.createReadStream(tmpPath));
    form.append("nodeType", "cm:content");
    form.append("name", fileName); // ✅ Alfresco conservera le vrai nom

    // 🔹 URL Alfresco avec query params
    const alfrescoUrl = `${ALFRESCO_UPLOAD_URL}?objetNodeId=${objetNodeId}&fieldName=${fieldName}&typeDocument=${typeDocument}`;

    // 🔹 Envoi vers Alfresco
    const uploadResponse = await axios.post(alfrescoUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Basic ${Buffer.from(`${ALFRESCO_USERNAME}:${ALFRESCO_PASSWORD}`).toString("base64")}`,
      },
    });

    // 🔹 Supprime le fichier temporaire
    fs.unlinkSync(tmpPath);

    // 🔹 Récupère le fichier créé depuis Alfresco
    const alfrescoFile = uploadResponse.data.files[0];

    // 🔹 Reformate la réponse pour le front-end
    const formattedResponse = {
      fieldName,
      files: [
        {
          documentNodeId: alfrescoFile.documentNodeId,
          fileName: fileName,
          fileExtension: fileName.split(".").pop().toLowerCase(),
          titre: alfrescoFile.titre || "",
          typeDocument,
        },
      ],
      isListField: true,
      site: "portail-recouvrement",
      status: "success",
      typeObjet: "dossier",
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error("❌ Erreur upload :", error.response?.data || error.message);
    return res.status(500).json({
      message: "Erreur lors de l'upload du document",
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