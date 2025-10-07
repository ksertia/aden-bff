const axios = require('axios');

// Informations d'authentification pour l'API de récupération des avocats
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

// Récupérer les avocats
exports.getAvocats = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL

  try {
    // Construire l'URL de l'API avec le sitename (ex: "portail-recouvrement")
    const url = `${process.env.baseUrl}/${sitename}/avocat`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const avocats = response.data;  // Les données retournées par l'API
      return res.json(avocats);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des avocats' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des avocats:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};


//___________
// Récupérer un avocats par son NodeID
exports.getAvocatById = async (req, res) => {
  const { sitename, avocatId } = req.params;  // Récupérer le sitename et avocatId à partir des paramètres de l'URL

  // Vérification que le sitename et avocatId sont présents
  if (!sitename || !avocatId) {
    return res.status(400).json({ error: 'Les paramètres sitename et debiteurId sont requis' });
  }

  try {
    // Construire l'URL de l'API avec le sitename et avocatId (ex: "portail-recouvrement" et avocatId)
    const url = `${process.env.baseUrl}/${sitename}/debiteur/${avocatId}`;

    // Effectuer la requête GET avec Axios, en ajoutant les headers nécessaires
    const response = await axios.get(url, config);

    // Vérifier que la réponse a un status 200
    if (response.status === 200) {
      const avocat = response.data;  // Les données retournées par l'API
      return res.json(avocat);  // Retourner les données au client
    } else {
      // Gestion des réponses non-200 avec un message d'erreur détaillé
      return res.status(response.status).json({ error: 'Erreur de récupération du avocat', details: response.statusText });
    }
  } catch (error) {
    // Gestion des erreurs avec message spécifique
    console.error('Erreur lors de la récupération du avocat:', error.message);
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