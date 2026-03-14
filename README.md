# tufaikoi-backend

Backend temps réel pour **TufaiKoi**, un jeu social multijoueur par navigateur. Les joueurs rejoignent une room, reçoivent des scénarios absurdes générés par IA, proposent leur réponse, puis votent pour la meilleure. Chaque choix influence le scénario suivant. Le tout fonctionne via WebSocket.

## Contexte du projet

- Jeu de société en ligne où les joueurs répondent à des mises en situation absurdes/drôles
- Conçu pour être joué entre amis sur téléphone ou navigateur
- Les scénarios sont générés dynamiquement par **Claude Sonnet 4.6** (via AWS Bedrock)
- Ce repository contient uniquement le serveur backend (API WebSocket)

## Fonctionnalités principales

- Création et gestion de rooms avec code à 4 chiffres
- Système d'hôte : le premier joueur qui crée la room devient hôte
- Transfert automatique du rôle d'hôte si celui-ci quitte
- Partie en 3 rounds narratifs avec 3 phases par round : réponse, vote, résultats
- **Scénarios IA** : chaque round génère un scénario basé sur le choix des joueurs au round précédent
- Conclusion IA en fin de partie (épilogue qui boucle l'histoire)
- Timer automatique de 60 secondes par phase avec transition automatique
- Soumission de réponses et votes avec validation
- Calcul des résultats (votes par réponse, détection du gagnant)
- Reconnexion des joueurs déconnectés avec grace period de 30 secondes
- Heartbeat pour détecter les connexions mortes (ping/pong toutes les 10s)
- Broadcast de l'état complet de la room à tous les joueurs après chaque action

## Stack technique

| Catégorie        | Technologie                                  |
| ---------------- | -------------------------------------------- |
| Langage          | TypeScript (ES2022, strict mode)             |
| Runtime          | Node.js                                      |
| Framework        | Express 5 (HTTP) + ws (WebSocket)            |
| IA               | Claude Sonnet 4.6 via AWS Bedrock            |
| Linter/Formatter | Biome (règles recommandées, indentation tab) |
| Tests            | Vitest                                       |
| Dev server       | ts-node-dev (hot reload)                     |
| CI/CD            | GitHub Actions (lint + tests)                |
| Base de données  | Aucune (stockage in-memory)                  |

## Installation

### Prérequis

- Node.js (version compatible ES2022)
- npm
- Un compte AWS avec accès à Bedrock (Claude Sonnet 4.6)

### Installation

```bash
git clone <url-du-repo>
cd tufaikoi-backend
npm install
```

### Configuration

Créer un fichier `.env` à la racine (voir `.env.example`) :

```
PORT=3000
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=eu-west-3
```

### Lancement

```bash
# Mode développement (hot reload)
npm run dev

# Linter + formatter (corrige automatiquement)
npm run lint

# Lint en mode vérification (CI)
npm run lint:ci

# Tests
npm test
```

## Structure du repository

```
src/
├── index.ts                    # Point d'entrée : serveur HTTP + WebSocket
├── messageHandler.ts           # Routeur de messages WebSocket
├── types.ts                    # Types partagés (ClientMessage, ServerMessage, GameDTO...)
│
├── domain/                     # Modèles métier
│   ├── game.ts                 # Logique d'une partie (rounds, phases, réponses, votes, IA)
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
    ├── sanitize.ts              # Sanitisation des entrées pour les prompts IA
    ├── questions.ts             # Scénarios de départ (round 1)
    ├── ai/
    │   ├── ai.ts                # Client AWS Bedrock, appel à Claude Sonnet 4.6
    │   └── prompts.ts           # Construction des prompts par round + conclusion
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
4. La partie se déroule en **3 rounds narratifs**, chacun avec 3 phases :
   - **ANSWERING** (60s) : le scénario + question sont affichés, les joueurs soumettent leur réponse
   - **VOTING** (60s) : les joueurs votent pour une réponse (par index, anonyme)
   - **RESULTS** (60s) : résultats affichés + le serveur génère le prochain scénario via l'IA
5. Après le 3ème round, l'IA génère un **épilogue** qui conclut l'histoire, puis l'état passe à `FINISHED`

### Génération IA des scénarios

Les scénarios forment une **histoire continue** sur les 3 rounds :

| Round | Type     | Description                                                  |
| ----- | -------- | ------------------------------------------------------------ |
| 1     | HOOK     | Scénario de départ (pioché depuis une liste statique)        |
| 2     | ESCALADE | Généré par l'IA à partir du scénario 1 + la réponse gagnante |
| 3     | TWIST    | Généré par l'IA à partir de toute l'histoire (rounds 1 et 2) |
| Fin   | ÉPILOGUE | Généré par l'IA — chute finale qui boucle l'histoire         |

L'IA est appelée pendant la phase RESULTS (en parallèle de l'affichage), donc le joueur ne subit aucune latence.

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

## Tests

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

## Auteur

Projet développé par Kilian Rodrigues.
