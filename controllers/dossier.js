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

exports.getDossiers = async (req, res) => {
  const { sitename } = req.params;  // Récupérer le sitename à partir des paramètres de l'URL
  const { step, statutGlobal, maxResults, debiteurNodeId, creancierNodeId, huissierNodeId, numeroDossier,partenaireNodeId,avocatNodeId,cedantNodeId } = req.query;  // Récupérer les paramètres de la requête (query string)

  try {
    // Construire les paramètres de la requête
    let queryParams = [];

    // Ajouter dynamiquement les paramètres s'ils sont présents
    if (step) queryParams.push(`step=${step}`);
    if (statutGlobal) queryParams.push(`statutGlobal=${statutGlobal}`);
    if (maxResults) queryParams.push(`maxResults=${maxResults}`);
    if (numeroDossier) queryParams.push(`numeroDossier=${numeroDossier}`);
    if (debiteurNodeId) queryParams.push(`debiteurNodeId=${debiteurNodeId}`);
    if (creancierNodeId) queryParams.push(`creancierNodeId=${creancierNodeId}`);
    if (huissierNodeId) queryParams.push(`huissierNodeId=${huissierNodeId}`);
    if (cedantNodeId) queryParams.push(`cedantNodeId=${cedantNodeId}`);
    if (avocatNodeId) queryParams.push(`avocatNodeId=${avocatNodeId}`);
    if (partenaireNodeId) queryParams.push(`partenaireNodeId=${partenaireNodeId}`);
    

    // Joindre les paramètres à l'URL
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `${process.env.baseUrl}/${sitename}/dossier${queryString}`;

    // Log de l'URL finale avant exécution pour vérifier la construction correcte de l'URL
    console.log('URL appelée :',url);

    // Effectuer la requête GET avec Axios et les headers nécessaires
    const response = await axios.get(url, config);

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      const dossiers = response.data;  // Les données retournées par l'API
      return res.json(dossiers);  // Retourner les données au client
    } else {
      // Si la réponse est incorrecte, retourner une erreur
      return res.status(500).json({ error: 'Erreur de récupération des dossiers' });
    }
  } catch (error) {
    // Gestion des erreurs en cas de problème avec la requête
    console.error('Erreur lors de la récupération des dossiers:', error.message);
    return res.status(500).json({ error: 'Une erreur est survenue', details: error.message });
  }
};