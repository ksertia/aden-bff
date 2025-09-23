Voici le fichier **`README.md`** complet avec toutes les étapes détaillées, y compris la configuration de **Strapi**, le **BFF**, l'authentification, les **endpoints**, le problème de **rôle non affiché** :


# Projet d'Authentification avec Strapi, BFF, et Angular

Ce projet met en place un **système complet d'authentification** avec **Strapi** en tant que backend, **BFF (Backend-for-Frontend)** pour centraliser les appels API, et **Angular** pour l'interface frontend. L'objectif est de gérer les utilisateurs, les rôles, et l'authentification sécurisée, tout en permettant l'affichage des informations des utilisateurs dans le **sidebar** et le **tableau de bord** d'Angular.

## Structure du Projet

1. **Strapi (Backend)** : Gère la création des utilisateurs, leur association avec des rôles et l'authentification via JWT.
2. **BFF (Backend-for-Frontend)** : Sert de proxy entre Strapi et Angular, centralise les appels API et l'authentification.
3. **Angular (Frontend)** : Interface utilisateur qui se connecte au BFF pour l'authentification et l'affichage des données utilisateur, y compris le rôle de l'utilisateur.

## Prérequis

1. Node.js installé (version >= 14.x)
2. MySQL ou une autre base de données configurée pour Strapi
3. Angular CLI installé

## Étapes du Projet

### 1. **Lancer Strapi**

#### a. Lancer Strapi en Local

1. Clone le repository Strapi (si ce n'est pas déjà fait).
2. Dans le dossier du projet Strapi, exécute les commandes suivantes pour installer les dépendances et démarrer le serveur :

```bash
npm install
npm run develop
````

3. Strapi sera disponible par défaut sur **[http://localhost:1337](http://localhost:1337)**.

#### b. Configurer les Utilisateurs et les Rôles dans Strapi

1. Va dans l'interface d'administration de **Strapi** ([http://localhost:1337/admin](http://localhost:1337/admin)).
2. Crée des **rôles** sous **Settings > Roles and Permissions** (ex. : **Débiteur**, **Huissier**, **Avocat**).
3. Dans **Users**, crée des utilisateurs et associe un rôle à chaque utilisateur (ex. : associer **`debiteur@example.com`** au rôle **Débiteur**).

#### c. Personnalisation du Contrôleur `auth.js`

Le contrôleur **`auth.js`** dans Strapi a été modifié pour peupler correctement la relation **`role`** lors de la connexion de l'utilisateur.

```javascript
// src/extensions/users-permissions/controllers/auth.js

module.exports = {
  async local(ctx) {
    const { identifier, password } = ctx.request.body;

    // Recherche de l'utilisateur par email et peupler la relation 'role'
    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: identifier },
      populate: { role: true },  // Peupler la relation 'role'
    });

    if (!user) {
      return ctx.badRequest('Identifiants invalides');
    }

    // Vérification du mot de passe
    const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);
    if (!validPassword) {
      return ctx.badRequest('Identifiants invalides');
    }

    // Création du JWT
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

    // Préparer la réponse en incluant le rôle de l'utilisateur
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || 'Nom non défini',  // Ajouter des valeurs par défaut si nécessaire
      lastName: user.lastName || 'Nom non défini',
      role: user.role.name || 'Rôle inconnu',  // Assurer que le rôle est présent
    };

    // Retourner le JWT et l'utilisateur, y compris son rôle
    ctx.send({
      jwt,
      user: sanitizedUser,
    });
  },
};
```

### 2. **Lancer le BFF (Backend-for-Frontend)**

Le BFF centralise les appels API entre le frontend Angular et le backend Strapi. Voici comment démarrer le serveur BFF.

#### a. Lancer le BFF en Local

1. Clone le repository du BFF (si ce n'est pas déjà fait).
2. Installe les dépendances :

```bash
npm install
```

3. Dans le fichier **`.env`**, assure-toi que **`STRAPI_URL`** est correctement configuré pour pointer vers ton serveur Strapi :

```env
STRAPI_URL=http://localhost:1337
```

4. Lance le serveur BFF :

```bash
node server.js
```

Le serveur BFF sera disponible sur **[http://localhost:3000](http://localhost:3000)**.

#### b. Routes du BFF

Le fichier **`authRoutes.js`** définit les routes suivantes :

* **POST /auth/register** : Inscription d'un utilisateur
* **POST /auth/login** : Connexion d'un utilisateur
* **GET /auth/creances** : Route protégée, accessible uniquement aux utilisateurs ayant un rôle spécifique (Créancier ou Cédant).

### 3. **Endpoints**

Les endpoints disponibles dans le projet sont les suivants :

#### **Strapi**

* **POST /api/auth/local/register** : Inscription d'un utilisateur avec `username`, `email`, et `password`.
* **POST /api/auth/local** : Connexion d'un utilisateur avec `identifier` (email) et `password`.
* **GET /api/users/me** : Récupération des informations de l'utilisateur authentifié.

#### **BFF**

* **POST /auth/register** : Appel à Strapi pour inscrire un utilisateur.
* **POST /auth/login** : Appel à Strapi pour connecter un utilisateur.
* **GET /auth/creances** : Route protégée, accessible uniquement si l'utilisateur a un rôle **Créancier** ou **Cédant**.

### 4. **Frontend Angular**

#### a. Connexion de l'utilisateur et récupération du rôle

Dans **Angular**, le **`AuthService`** est utilisé pour gérer la connexion et stocker les informations de l'utilisateur (y compris son rôle) dans **localStorage**.

#### b. Exemple de `AuthService` en Angular

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: { email: string, password: string }) {
    return this.http.post<any>('http://localhost:3000/auth/login', credentials)
      .subscribe(response => {
        const user = response.user;
        if (user) {
          this.currentUserSubject.next(user);  // Sauvegarder l'utilisateur dans le sujet
          localStorage.setItem('currentUser', JSON.stringify(user));  // Sauvegarder dans le localStorage
        }
      });
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);  // Retirer l'utilisateur du sujet
  }
}
```

### 5. **Problème de Rôle non Affiché**

#### Contexte du problème :

Lors de la connexion, le rôle de l'utilisateur n'était pas correctement affiché dans le frontend Angular, même si le rôle était renvoyé depuis Strapi dans la réponse.
---

Ce **README.md** est conçu pour expliquer le projet étape par étape, en détaillant la configuration de **Strapi**, du **BFF**, l'authentification, les endpoints, ainsi que le problème du **rôle non affiché**.
