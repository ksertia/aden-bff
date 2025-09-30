const axios = require('axios');

// Configuration des headers avec l'authentification Basic
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Base URL commune pour l'API
const baseUrl = 'http://54.38.55.19:8181/alfresco/s/ged/search-objets';

// Fonction pour récupérer les données d'un utilisateur spécifique
const fetchUserData = async (sitename, userType) => {
  try {
    const url = `${baseUrl}/${sitename}/${userType}`;
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des ${userType}:`, error.message);
    throw new Error(`Erreur de récupération des ${userType}`);
  }
};

// Contrôleur principal pour récupérer les données de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL

  if (!sitename) {
    return res.status(400).json({ error: 'Le paramètre sitename est requis' });
  }

  try {
    // Récupérer les données pour tous les types d'utilisateurs
    const debiteurs = await fetchUserData(sitename, 'debiteur');
    const huissiers = await fetchUserData(sitename, 'huissier');
    const avocats = await fetchUserData(sitename, 'avocat');
    const creanciers = await fetchUserData(sitename, 'creancier');
    const cedants = await fetchUserData(sitename, 'cedant');
    const partenaires = await fetchUserData(sitename, 'partenaire');

    // Retourner toutes les données dans un seul objet
    // return res.json({
    //   debiteurs,
    //   huissiers,
    //   avocats,
    //   creanciers,
    //   cedants,
    //   partenaires,
    // });
     return res.json({
      debiteurs: debiteurs.data,
      huissiers: huissiers.data,
      avocats: avocats.data,
      creanciers: creanciers.data,
      cedants: cedants.data,
      partenaires: partenaires.data,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des utilisateurs', details: error.message });
  }
};
