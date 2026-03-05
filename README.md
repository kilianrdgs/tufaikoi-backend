# tufaikoi-backend

Backend temps réel pour **Tu Fais Koi**, un jeu social multijoueur par navigateur. Les joueurs rejoignent une room, reçoivent une question de mise en situation, proposent leur réponse, puis votent pour la meilleure. Le tout fonctionne via WebSocket.

## Contexte du projet

- Jeu de société en ligne où les joueurs répondent à des questions de mise en situation absurdes/drôles
- Conçu pour être joué entre amis sur téléphone ou navigateur
- Ce repository contient uniquement le serveur backend (API WebSocket)

## Fonctionnalités principales

- Création et gestion de rooms avec code à 4 chiffres
- Système d'hôte : le premier joueur qui crée la room devient hôte
- Transfert automatique du rôle d'hôte si celui-ci quitte
- Partie en 3 rounds avec 3 phases par round : réponse, vote, résultats
- Timer automatique de 60 secondes par phase avec transition automatique
- Soumission de réponses et votes avec validation
- Calcul des résultats (votes par réponse, détection du gagnant)
- Reconnexion des joueurs déconnectés avec grace period de 30 secondes
- Heartbeat pour détecter les connexions mortes (ping/pong toutes les 10s)
- Broadcast de l'état complet de la room à tous les joueurs après chaque action

## Architecture du projet

Architecture en couches avec séparation nette entre le domaine métier et la couche de communication WebSocket.

```
Client (WebSocket)
    |
    v
index.ts (serveur HTTP + WebSocket)
    |
    v
messageHandler.ts (routeur de messages)
    |
    v
handlers/ (logique de traitement par action)
    |
    v
domain/ (modèles métier : Game, Room, Player, RoomManager, GameManager)
    |
    v
utils/ (broadcast, reconnexion, heartbeat, questions)
```

- **Pas de base de données** : tout est stocké en mémoire (Maps)
- **Pas de REST API** : toute la communication passe par WebSocket (sauf un endpoint GET `/` de health check)
- **Pattern message-based** : le client envoie un message JSON typé, le serveur route vers le bon handler

## Stack technique

| Catégorie        | Technologie                                  |
| ---------------- | -------------------------------------------- |
| Langage          | TypeScript (ES2022, strict mode)             |
| Runtime          | Node.js                                      |
| Framework        | Express 5 (HTTP) + ws (WebSocket)            |
| Linter/Formatter | Biome (règles recommandées, indentation tab) |
| Tests            | Vitest                                       |
| Dev server       | ts-node-dev (hot reload)                     |
| Base de données  | Aucune (stockage in-memory)                  |
| CI/CD            | Non configuré                                |

## Installation

### Prérequis

- Node.js (version compatible ES2022)
- npm

### Installation

```bash
git clone <url-du-repo>
cd tufaikoi-backend
npm install
```

### Configuration

Le serveur utilise la variable d'environnement `PORT` (défaut : `3000`). Un fichier `.env` est attendu à la racine (ignoré par git).

### Lancement

```bash
# Mode développement (hot reload)
npm run dev

# Linter + formatter
npm run lint
```

## Structure du repository

```
src/
├── index.ts                    # Point d'entrée : serveur HTTP + WebSocket
├── messageHandler.ts           # Routeur de messages WebSocket
├── types.ts                    # Types partagés (ClientMessage, ServerMessage, GameDTO...)
│
├── domain/                     # Modèles métier
│   ├── game.ts                 # Logique d'une partie (rounds, phases, réponses, votes)
│   ├── gameManager.ts          # Registre des parties actives (Map roomId -> Game)
│   ├── room.ts                 # Logique d'une room (joueurs, hôte, états)
│   ├── roomManager.ts          # Registre des rooms actives (Map roomId -> Room)
│   ├── player.ts               # Modèle joueur (id, username, roomId)
│   ├── phaseTimer.ts           # Timer générique pour les phases de jeu
│   └── tests/                  # Tests unitaires du domaine
│
├── handlers/                   # Handlers pour chaque type de message
│   ├── room/
│   │   ├── createRoom.ts       # Création d'une room
│   │   ├── joinRoom.ts         # Rejoindre une room
│   │   └── leaveRoom.ts        # Quitter une room
│   ├── game/
│   │   ├── nextPhase.ts        # Passage à la phase suivante (hôte uniquement)
│   │   ├── submitAnswer.ts     # Soumission d'une réponse
│   │   └── submitVote.ts       # Soumission d'un vote
│   └── startGame.ts            # Lancement de la partie (hôte uniquement)
│
└── utils/
    ├── broadcastRoomUpdate.ts   # Envoie l'état de la room à tous les joueurs
    ├── sendServerMessage.ts     # Envoie un message à un seul joueur
    ├── generateRoomCode.ts      # Génère un code de room à 4 chiffres
    ├── questions.ts             # Liste statique des questions
    └── reconnection/
        ├── gracePeriod.ts       # Grace period avant suppression d'un joueur déconnecté
        ├── heartbeat.ts         # Ping/pong pour détecter les connexions mortes
        ├── reconnectPlayer.ts   # Restauration d'un joueur déconnecté
        └── tests/               # Tests de la reconnexion
```

## Fonctionnement interne

### Cycle de vie d'une partie

1. Un joueur crée une room (`CREATE_ROOM`) et devient hôte
2. D'autres joueurs rejoignent via le code à 4 chiffres (`JOIN_ROOM`)
3. L'hôte lance la partie (`START_GAME`) — minimum 2 joueurs requis
4. La partie se déroule en **3 rounds**, chacun avec 3 phases :
   - **ANSWERING** (60s) : les joueurs soumettent leur réponse à la question
   - **VOTING** (60s) : les joueurs votent pour une réponse (par index)
   - **RESULTS** (60s) : affichage des résultats (votes par réponse, gagnant)
5. Après le 3ème round, l'état passe à `FINISHED`

### Flux de données

- Toute communication est bidirectionnelle via WebSocket
- Le client envoie des `ClientMessage` (type + payload)
- Le serveur répond avec des `ServerMessage` : soit `ROOM_UPDATE` (broadcast à tous), soit `ERROR` (unicast)
- Après chaque action, l'état complet de la room (incluant l'état du jeu) est broadcast à tous les joueurs

### Gestion des déconnexions

- Un **heartbeat** ping les clients toutes les 10 secondes
- Si un client ne répond pas au pong, sa connexion est terminée
- À la déconnexion, une **grace period** de 30 secondes démarre
- Pendant ce délai, le joueur peut se reconnecter via `RECONNECT` avec son `playerId`
- Passé le délai, le joueur est retiré de la room (et la room est supprimée si vide)

### Gestion des erreurs

- Les messages JSON invalides retournent une erreur `Invalid JSON`
- Les erreurs métier (ex: voter hors de la phase de vote) sont attrapées et renvoyées au client sous forme de `ServerMessage` de type `ERROR`
- Les erreurs inattendues dans les handlers sont loguées côté serveur et renvoyées génériquement au client

## Protocole WebSocket

### Messages client → serveur

| Type            | Payload                                | Description                        |
| --------------- | -------------------------------------- | ---------------------------------- |
| `CREATE_ROOM`   | `{ username: string }`                 | Créer une room                     |
| `JOIN_ROOM`     | `{ roomId: string, username: string }` | Rejoindre une room                 |
| `LEAVE_ROOM`    | —                                      | Quitter la room                    |
| `START_GAME`    | —                                      | Lancer la partie (hôte uniquement) |
| `NEXT_PHASE`    | —                                      | Phase suivante (hôte uniquement)   |
| `SUBMIT_ANSWER` | `{ answer: string }`                   | Soumettre une réponse              |
| `SUBMIT_VOTE`   | `{ answerIndex: number }`              | Voter pour une réponse             |
| `RECONNECT`     | `{ playerId: string }`                 | Se reconnecter                     |

### Messages serveur → client

| Type          | Payload                                                   | Description               |
| ------------- | --------------------------------------------------------- | ------------------------- |
| `CONNECTED`   | `{ playerId: string }`                                    | Confirmation de connexion |
| `ROOM_UPDATE` | `{ roomId, hostId, players, state, game: GameDTO\|null }` | État complet de la room   |
| `ERROR`       | `{ message: string }`                                     | Erreur                    |

### Structure de GameDTO

```typescript
{
  state: "PLAYING" | "FINISHED"
  phase: "ANSWERING" | "VOTING" | "RESULTS"
  currentRound: number        // 1 à 3
  maxRounds: number           // 3
  question: string | null
  answers: string[] | null    // visible uniquement en phase VOTING
  results: RoundResult[] | null  // visible uniquement en phase RESULTS
  endTime: number | null      // timestamp de fin du timer courant
}
```

## Tests

Les tests unitaires couvrent la couche domaine et les utilitaires de reconnexion.

```bash
npm test
```

**Fichiers de tests :**

- `src/domain/tests/game.test.ts` — logique de partie (phases, réponses, votes, résultats)
- `src/domain/tests/room.test.ts` — logique de room (ajout/retrait joueurs, hôte, états)
- `src/domain/tests/roomManager.test.ts` — registre des rooms
- `src/domain/tests/gameManager.test.ts` — registre des parties
- `src/utils/reconnection/tests/reconnectPlayer.test.ts` — reconnexion
- `src/utils/reconnection/tests/gracePeriod.test.ts` — grace period

**Framework :** Vitest

## Améliorations possibles

- **Persistence** : remplacer le stockage in-memory par une base de données (Redis, PostgreSQL) pour supporter le redémarrage du serveur
- **Rotation des questions** : actuellement seule `questions[0]` est utilisée à chaque partie — implémenter une sélection aléatoire ou séquentielle parmi les 6 questions disponibles
- **Questions dynamiques** : charger les questions depuis une source externe ou permettre aux joueurs d'en proposer
- **Scalabilité** : ajouter un système de pub/sub (Redis) pour supporter plusieurs instances du serveur
- **Authentification** : ajouter un système d'identification des joueurs (tokens, sessions)
- **Validation des entrées** : valider les payloads des messages (longueur du username, contenu des réponses) avec un schéma (Zod, etc.)
- **CI/CD** : mettre en place une pipeline d'intégration continue (GitHub Actions)
- **Déploiement** : ajouter un Dockerfile et une configuration de production
- **Score global** : maintenir un score cumulé sur l'ensemble des rounds d'une partie
- **Gestion de la room post-partie** : permettre de relancer une partie sans recréer de room

## Auteur

Projet développé par Kilian Rodrigues.
