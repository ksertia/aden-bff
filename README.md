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

### Pour activer la fonctionnalité de récupération du rôle utilisateur via le double appel dans Strapi, vous devez configurer les permissions de chaque rôle dans les paramètres du plugin users-permissions.

1. Activer les permissions pour les rôles
Naviguez vers le panneau d'administration de Strapi : Settings -> Users & Permissions Plugin -> Roles.

Sélectionnez le rôle concerné (par exemple, "Authenticated").

Dans la section Users & Permissions, activez les permissions suivantes :

User: Cochez la case find. Cette action permet à votre application de rechercher et d'accéder aux informations de l'utilisateur.

User: Cochez la case me. Cette permission est essentielle, car elle autorise l'utilisateur à récupérer ses propres informations de profil (y compris le rôle) après s'être authentifié.

User: Cochez la case find pour l'attribut role. Sans cela, même si le champ me est autorisé, le rôle ne sera pas renvoyé dans la réponse de l'API.

2. Double appel API
Strapi ne renvoie pas le rôle de l'utilisateur directement après une connexion réussie. Pour obtenir le rôle, votre application doit effectuer deux appels distincts :

Appel de connexion (POST /api/auth/local)

Le premier appel permet de s'authentifier et de recevoir un JWT (JSON Web Token).

Ce JWT est nécessaire pour authentifier toutes les requêtes subséquentes.

Appel de profil (GET /api/users/me?populate=role)

Le second appel utilise le JWT pour récupérer les informations de l'utilisateur.

En ajoutant le paramètre ?populate=role, vous demandez à Strapi d'inclure les détails du rôle dans la réponse.

En suivant ces étapes, vous vous assurez que le rôle de l'utilisateur est correctement récupéré et que les permissions nécessaires sont en place pour éviter les erreurs d'accès refusé (ForbiddenError).

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
