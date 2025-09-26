'use strict';

const axios = require('axios');

// Récupérer tous les utilisateurs (avec un filtre par rôle)
exports.getAllUsers = async (ctx) => {
  const { role } = ctx.query; // Récupérer le rôle via les paramètres de la requête (ex: ?role=debiteur)
  try {
    let query = {};
    if (role) {
      query = { role };  // Filtrer les utilisateurs par rôle
    }

    // Récupérer tous les utilisateurs dans Strapi
    const users = await strapi.query('user', 'users-permissions').find({ where: query });
    ctx.send(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error.message);
    ctx.throw(500, 'Erreur serveur');
  }
};

// Ajouter un utilisateur (Administrateur peut ajouter n'importe quel rôle)
exports.addUser = async (ctx) => {
  const { email, username, password, role } = ctx.request.body;
  try {
    const user = await strapi.plugins['users-permissions'].services.user.add({
      email,
      username,
      password,
      role,  // Le rôle de l'utilisateur (debiteur, huissier, avocat, etc.)
    });
    ctx.send(user);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error.message);
    ctx.throw(500, 'Erreur serveur');
  }
};

// Modifier un utilisateur
exports.updateUser = async (ctx) => {
  const { id } = ctx.params;  // Récupérer l'id de l'utilisateur à mettre à jour
  const { email, username, role } = ctx.request.body;  // Données à modifier
  try {
    const updatedUser = await strapi.query('user', 'users-permissions').update(
      { id },
      { email, username, role }
    );
    ctx.send(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error.message);
    ctx.throw(500, 'Erreur serveur');
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (ctx) => {
  const { id } = ctx.params;  // Récupérer l'id de l'utilisateur à supprimer
  try {
    const deletedUser = await strapi.query('user', 'users-permissions').delete({ id });
    ctx.send({ message: 'Utilisateur supprimé', deletedUser });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error.message);
    ctx.throw(500, 'Erreur serveur');
  }
};
