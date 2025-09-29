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
exports.getDebiteurs = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL
  const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';  // Base URL de l'API

  try {
    // Construire l'URL de l'API avec le sitename (ex: "portail-recouvrement")
    const url = `${baseUrl}/${sitename}/debiteur?maxResults=50`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const debiteurs = response.data;  // Les données retournées par l'API
      return res.json(debiteurs);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des débiteurs' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des débiteurs:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};


// Récupérer un débiteur par son NodeID
exports.getDebiteurById = async (req, res) => {
  const { sitename, debiteurId } = req.params;  // Récupérer le sitename et debiteurId à partir des paramètres de l'URL

  // Vérification que le sitename et debiteurId sont présents
  if (!sitename || !debiteurId) {
    return res.status(400).json({ error: 'Les paramètres sitename et debiteurId sont requis' });
  }

  const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';  // Base URL de l'API

  try {
    // Construire l'URL de l'API avec le sitename et debiteurId (ex: "portail-recouvrement" et debiteurId)
    const url = `${baseUrl}/${sitename}/debiteur/${debiteurId}`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Vérifier que la réponse a un status 200
    if (response.status === 200) {
      const debiteur = response.data;  // Les données retournées par l'API
      return res.json(debiteur);  // Retourner les données au client
    } else {
      // Gestion des réponses non-200 avec un message d'erreur détaillé
      return res.status(response.status).json({ error: 'Erreur de récupération du débiteur', details: response.statusText });
    }
  } catch (error) {
    // Gestion des erreurs avec message spécifique
    console.error('Erreur lors de la récupération du débiteur:', error.message);
    if (error.response) {
      // Si l'erreur provient de la réponse de l'API
      return res.status(error.response.status).json({ error: 'Erreur dans la réponse de l\'API', details: error.response.data });
    } else if (error.request) {
      // Si la requête a été faite mais qu'aucune réponse n'a été reçue
      return res.status(500).json({ error: 'Pas de réponse de l\'API', details: error.message });
    } else {
      // Autres erreurs
      return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
    }
  }
};

