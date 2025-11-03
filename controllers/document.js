// ==============================================
// CONTROLLER : Gestion des documents Alfresco
// ==============================================

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

// ======================
// Variables d'environnement
// ======================
const ALFRESCO_UPLOAD_URL = process.env.ALFRESCO_UPLOAD_URL;
const ALFRESCO_USERNAME = process.env.ALFRESCO_USERNAME;
const ALFRESCO_PASSWORD = process.env.ALFRESCO_PASSWORD;
const WS_METIER_URL = process.env.WS_METIER_URL;

// ==============================================
//  UPLOAD DOCUMENT VERS ALFRESCO
// ==============================================
exports.uploadDocument = async (req, res) => {
  try {
    // Vérifie la présence d'un fichier
    if (!req.file) return res.status(400).json({ message: "Aucun fichier uploadé" });

    // Prépare le corps de la requête (multipart/form-data)
    const form = new FormData();
    form.append('filedata', fs.createReadStream(req.file.path));
    form.append('name', req.file.originalname);
    form.append('nodeType', 'cm:content');

    // Envoi du fichier vers Alfresco
    const uploadResponse = await axios.post(ALFRESCO_UPLOAD_URL, form, {
      headers: form.getHeaders(),
      auth: {
        username: ALFRESCO_USERNAME,
        password: ALFRESCO_PASSWORD
      }
    });

    // 🧹 Supprime le fichier temporaire après upload
    fs.unlinkSync(req.file.path);

    const data = uploadResponse.data.entry;

    // Retourne la même structure qu’Alfresco
    return res.status(200).json({
      entry: {
        isFile: true,
        createdByUser: data.createdByUser || { id: "admin", displayName: "Administrator" },
        modifiedAt: data.modifiedAt,
        nodeType: data.nodeType,
        content: data.content,
        parentId: data.parentId,
        aspectNames: data.aspectNames || ["cm:versionable", "cm:titled", "cm:auditable", "cm:author"],
        createdAt: data.createdAt,
        isFolder: false,
        modifiedByUser: data.modifiedByUser || { id: "admin", displayName: "Administrator" },
        name: data.name,
        id: data.id,
        properties: data.properties || {
          "cm:versionLabel": "1.0",
          "cm:author": "Fadilatou",
          "cm:versionType": "MAJOR",
        },
      },
    });

  } catch (error) {
    console.error(" Erreur upload :", error.response?.data || error.message);
    return res.status(500).json({
      message: "Erreur lors de l'upload du document",
      error: error.response?.data || error.message,
    });
  }
};

// // ==============================================
// // ASSOCIATION DU DOCUMENT À UN OBJET
// // ==============================================
// exports.associateDocument = async (req, res) => {
//   try {
//     const {
//       raisonSociale, contactPrincipal, emailProfessionnel,
//       telephone, adresseSiegeSocial, codePostal, ifu,
//       secteurActivite, chiffreAffaires, nombreEmployes,
//       typeCreancier, delaiPaiementHabituel, assuranceCredit,
//       commentaires, documentIdentite
//     } = req.body;

//     const dateNow = new Date().toISOString().replace('T', ' ').substring(0, 19);
//     const objetId = `cedant-admin-portail-recouvrement-${dateNow.replace(/[-:\s]/g, '')}`;

//     const responseData = {
//       code: 200,
//       data: {
//         map: {
//           dateCreation: dateNow,
//           createurUsername: "admin",
//           raisonSociale,
//           contactPrincipal,
//           emailProfessionnel,
//           telephone,
//           adresseSiegeSocial,
//           codePostal,
//           ifu,
//           secteurActivite,
//           chiffreAffaires,
//           nombreEmployes,
//           typeCreancier,
//           delaiPaiementHabituel,
//           assuranceCredit,
//           commentaires,
//           typeObjet: "cedant",
//           statutGlobal: "NOUVEAU",
//           objetId,
//           documentIdentite: {
//             titre: documentIdentite?.titre || "",
//             typeDocument: documentIdentite?.typeDocument || "",
//             documentNodeId: documentIdentite?.documentNodeId,
//             fileName: documentIdentite?.fileName,
//             fileExtension: documentIdentite?.fileName?.split('.').pop() || "",
//           },
//         },
//       },
//       details: "Record successfully created",
//       message: "OK",
//     };

//     return res.status(200).json(responseData);

//   } catch (error) {
//     console.error(" Erreur association :", error);
//     return res.status(500).json({
//       message: "Erreur lors de l'association du document",p
//       error: error.message,
//     });
//   }
// };

// ==============================================
//  RÉCUPÉRER LE CONTENU D'UN DOCUMENT PAR NODEID
// ==============================================
exports.getDocumentContent = async (req, res) => {
  try {
    const { nodeId } = req.params;

    //  URL complète du contenu du document Alfresco
    const url = `${WS_METIER_URL}/alfresco/service/api/node/content/workspace/SpacesStore/${nodeId}`;

    //  Requête HTTP GET avec authentification Basic
    const response = await axios.get(url, {
      responseType: 'arraybuffer', // Pour recevoir du binaire
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ALFRESCO_USERNAME}:${ALFRESCO_PASSWORD}`).toString('base64')}`
      }
    });

    //  Transmet directement le fichier téléchargé avec le bon type MIME
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(response.data);

  } catch (error) {
    console.error(" Erreur récupération contenu :", error.response?.data || error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération du contenu du document",
      error: error.response?.data || error.message,
    });
  }
};
