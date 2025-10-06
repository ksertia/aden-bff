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
exports.getCedants = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL

  try {
    // Construire l'URL de l'API avec le sitename (ex: "portail-recouvrement")
    const url = `${process.env.baseUrl}/${sitename}/cedant`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const cedants = response.data;  // Les données retournées par l'API
      return res.json(cedants);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des cedants' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des cedants:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};
