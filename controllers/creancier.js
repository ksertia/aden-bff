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

// Récupérer les Créanciers
exports.getCreanciers = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL
  const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';  // Base URL de l'API

  try {
    // Construire l'URL de l'API avec le sitename (ex: "portail-recouvrement")
    const url = `${baseUrl}/${sitename}/creancier`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const creanciers = response.data;  // Les données retournées par l'API
      return res.json(creanciers);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des creanciers' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des creanciers:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};

// Récupérer les Créances d'un créancier avec les 
exports.getCreances = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL
  const { typeCreance, statutCreance, maxResults } = req.query;  // Récupérer les paramètres de la requête (query string)

  const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';  // Base URL de l'API

  try {
    // Construire les paramètres de la requête
    let queryParams = [];

    // Ajouter dynamiquement les paramètres s'ils sont présents
    if (typeCreance) queryParams.push(`typeCreance=${typeCreance}`);
    if (statutCreance) queryParams.push(`statutCreance=${statutCreance}`);
    if (maxResults) queryParams.push(`maxResults=${maxResults}`);
    // if (debiteurNodeId) queryParams.push(`debiteurNodeId=${debiteurNodeId}`);

    // Joindre les paramètres à l'URL
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `${baseUrl}/${sitename}/creance${queryString}`;

    // Log de l'URL finale avant exécution pour vérifier la construction correcte de l'URL
    console.log(url);

    // Effectuer la requête GET avec Axios et les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const creances = response.data;  // Les données retournées par l'API
      return res.json(creances);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des créances' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des créances:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};