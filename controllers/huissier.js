const axios = require('axios');

// Informations d'authentification pour l'API de récupération des débiteurs
const username = 'admin';  // Exemple : admin
const password = 'admin';  // Exemple : admin
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

// Configuration des headers avec l'authentification Basic
const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Récupérer les débiteurs
exports.getHuissiers = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL
  const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';  // Base URL de l'API

  try {
    // Construire l'URL de l'API avec le sitename (ex: "portail-recouvrement")
    const url = `${baseUrl}/${sitename}/huissier?maxResults=50`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const huissiers = response.data;  // Les données retournées par l'API
      return res.json(huissiers);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des huissiers' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des huissiers:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};
