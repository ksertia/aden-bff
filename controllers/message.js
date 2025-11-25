const axios = require('axios');

// Auth
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

// Headers communs
const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Créer un message
exports.createMessage = async (req, res) => {
  const { sitename } = req.params;

  // Base URL de ton API Alfresco
//   const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/messages';

  try {
    // Données venant du client (body)
    const {
      nodeId,
      objet,
      contenu,
      statut,
      dateEnvoi,
      expediteur,
      destinataire
    } = req.body;

    // Construction du payload
    const messagePayload = {
      nodeId,
      objet,
      contenu,
      statut,
      dateEnvoi,
      expediteur,
      destinataire
    };

    // URL finale ex : /portail-recouvrement/message
    const url = `${process.env.baseUrl}/${sitename}/message`;

    // Log pour vérification
    console.log('POST URL:', url);
    console.log('Payload:', messagePayload);

    // Requête POST
    const response = await axios.post(url, messagePayload, config);

    // Contrôle du statut
    if (response.status === 200 || response.status === 201) {
      return res.json({
        success: true,
        message: 'Message créé avec succès',
        data: response.data
      });
    } else {
      return res.status(500).json({ error: 'Erreur lors de la création du message' });
    }

  } catch (error) {
    console.error('Erreur lors de la création du message:', error.message);
    return res.status(500).json({
      error: 'Une erreur est survenue',
      details: error.message
    });
  }
};
