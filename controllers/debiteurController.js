const axios = require('axios');

// Informations d'authentification pour WS Métier
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

//const basicAuthHeader = `Basic ${basicAuth}`;
const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
const axios = require('axios'); // Assurez-vous d'installer axios en faisant npm install axios

// Controller pour récupérer la liste des débiteurs
exports.getDebiteurs = async (req, res) => {
  try {
    // Faites une requête GET à l'API pour récupérer les débiteurs
    const businessDebitorResponse = await axios.get(
      `${process.env.WS_METIER_URL}/alfresco/s/ged/search-objets/${process.env.SITENAME}/debiteur?maxResults=50`
    //  {{baseUrl}}/ged/search-objets/{{sitename}}/debiteur?maxResults=50
    // const businessUserResponse = await axios.get(`${process.env.WS_METIER_URL}/alfresco/s/ged/objet-by-id/${userWithRole.nodeId}`, config);
    // businessUser = businessUserResponse.data?.data?.map;
    );

    // Récupérer les données des débiteurs dans le bon format
    const debiteurs = businessDebitorResponse.data?.data?.map(item => {
      const map = item.map; // Accéder à la clé "map"
      return {
        dateCreation: map.dateCreation,
        createurUsername: map.createurUsername,
        typeObjet: map.typeObjet,
        statutGlobal: map.statutGlobal,
        step: map.step,
        objetId: map.objetId,
        isDeleted: map.isDeleted,
        isFinish: map.isFinish,
        isArchive: map.isArchive,
        nameObjet: map.nameObjet,
        nodeId: map.nodeId,
        createur: {
          title: map.createur.map.title,
          username: map.createur.map.username
        },
        rangObjet: map.rangObjet,
        owner: map.owner,
        enRetard: map.enRetard,
        traitez: map.traite,
        stepGlobal: map.stepGlobal,
      };
    });

    // Envoyer la réponse au client
    res.json({
      message: "Liste des débiteurs récupérée avec succès",
      data: debiteurs,
      totalCount: debiteurs.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des débiteurs:', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des débiteurs", error: error.response?.data || error.message });
  }
};
