# API WebSocket - tufaikoi

Documentation complète du protocole WebSocket pour l'intégration frontend.

## Connexion

```
ws://localhost:3000
```

À la connexion, le serveur envoie automatiquement un message `CONNECTED` avec le `playerId` attribué. **Stocker ce `playerId`** — il est nécessaire pour la reconnexion.

```json
{ "type": "CONNECTED", "payload": { "playerId": "uuid-du-joueur" } }
```

---

## Messages Client → Serveur

Tous les messages sont en JSON avec un champ `type`.

### 1. Créer une room

```json
{ "type": "CREATE_ROOM", "payload": { "username": "Kilian" } }
```

Le créateur devient automatiquement **hôte** de la room.

### 2. Rejoindre une room

```json
{ "type": "JOIN_ROOM", "payload": { "roomId": "1234", "username": "Lucas" } }
```

### 3. Quitter une room

```json
{ "type": "LEAVE_ROOM" }
```

Si l'hôte quitte, le rôle est transféré automatiquement à un autre joueur.

### 4. Lancer la partie (hôte uniquement)

```json
{ "type": "START_GAME" }
```

> Minimum 2 joueurs requis.

### 5. Soumettre une réponse (phase ANSWERING)

```json
{ "type": "SUBMIT_ANSWER", "payload": { "answer": "Ma réponse" } }
```

> Une seule réponse par joueur par round. Renvoie une erreur si déjà soumise.

### 6. Voter pour une réponse (phase VOTING)

```json
{ "type": "SUBMIT_VOTE", "payload": { "answerIndex": 0 } }
```

> `answerIndex` = l'index de la réponse dans le tableau `answers` du `ROOM_UPDATE`. Un seul vote par joueur.

### 7. Passer à la phase suivante (hôte uniquement)

```json
{ "type": "NEXT_PHASE" }
```

> Les phases avancent aussi automatiquement après 60 secondes.

### 8. Se reconnecter

```json
{ "type": "RECONNECT", "payload": { "playerId": "uuid-du-joueur" } }
```

> Fonctionne pendant 30 secondes après la déconnexion. Envoyer ce message sur la nouvelle connexion WebSocket avec le `playerId` reçu au `CONNECTED` initial.

---

## Messages Serveur → Client

### CONNECTED

Envoyé **une seule fois** à la connexion WebSocket.

```json
{ "type": "CONNECTED", "payload": { "playerId": "uuid-du-joueur" } }
```

### ROOM_UPDATE

Envoyé à **tous les joueurs de la room** après chaque action. C'est le message principal — le front doit se baser entièrement dessus pour afficher l'état.

```json
{
  "type": "ROOM_UPDATE",
  "payload": {
    "roomId": "ABCD",
    "hostId": "player-uuid",
    "players": [
      { "id": "player-uuid", "username": "Kilian" },
      { "id": "player-uuid-2", "username": "Lucas" }
    ],
    "state": "WAITING",
    "game": null
  }
}
```

### ERROR

Envoyé uniquement au joueur concerné.

```json
{ "type": "ERROR", "payload": { "message": "Not in answering phase" } }
```

---

## Objet `game` dans ROOM_UPDATE

Quand une partie est en cours (`state: "IN_GAME"`), le champ `game` contient :

```typescript
{
  state: "PLAYING" | "FINISHED"
  phase: "ANSWERING" | "VOTING" | "RESULTS"
  currentRound: number        // 1 à 3
  maxRounds: number           // 3
  scenario: string            // le scénario du round (contexte narratif)
  question: string            // la question posée aux joueurs
  answers: string[] | null    // visible uniquement en phase VOTING
  results: RoundResult[] | null  // visible uniquement en phase RESULTS ou FINISHED
  endTime: number | null      // timestamp (ms) de fin du timer courant
}
```

### Données par phase

| Phase       | `scenario`        | `question`       | `answers`                       | `results`         | `endTime`     |
| ----------- | ----------------- | ---------------- | ------------------------------- | ----------------- | ------------- |
| `ANSWERING` | Scénario du round | Question ouverte | `null`                          | `null`            | timestamp fin |
| `VOTING`    | Scénario du round | Question ouverte | `["réponse1", "réponse2", ...]` | `null`            | timestamp fin |
| `RESULTS`   | Scénario du round | Question ouverte | `null`                          | `RoundResult[]`   | timestamp fin |
| `FINISHED`  | Épilogue IA       | `"FIN."`         | `null`                          | `RoundResult[]`   | `null`        |

### RoundResult

```json
{
  "username": "Lucas",
  "answer": "Ma réponse",
  "votes": 3,
  "isWinner": true
}
```

> Il peut y avoir plusieurs `isWinner: true` en cas d'égalité.

---

## Timer

Chaque phase a un timer de **60 secondes**. Le champ `endTime` dans le `game` est un timestamp en millisecondes (comparable à `Date.now()`).

**Côté front**, calculer le temps restant avec :

```typescript
const remaining = Math.max(0, game.endTime - Date.now())
```

Quand le timer expire, le serveur avance automatiquement la phase et envoie un nouveau `ROOM_UPDATE`.

---

## Flow complet d'une partie

```
CONNEXION
  ← CONNECTED { playerId }

LOBBY
  → CREATE_ROOM { username }
  ← ROOM_UPDATE (state: WAITING, game: null)

  → JOIN_ROOM { roomId, username }
  ← ROOM_UPDATE (2 joueurs)

ROUND 1 — Scénario de départ (statique)
  → START_GAME
  ← ROOM_UPDATE (state: IN_GAME, game.phase: ANSWERING, scenario + question)

  → SUBMIT_ANSWER { answer } (chaque joueur)
  ← ROOM_UPDATE (à chaque soumission)

  → NEXT_PHASE (ou timer 60s)
  ← ROOM_UPDATE (game.phase: VOTING, answers: [...])

  → SUBMIT_VOTE { answerIndex } (chaque joueur)
  ← ROOM_UPDATE (à chaque vote)

  → NEXT_PHASE (ou timer 60s)
  ← ROOM_UPDATE (game.phase: RESULTS, results: [...])
     ↳ en arrière-plan : l'IA génère le scénario du round 2

ROUND 2 — Scénario IA (ESCALADE, basé sur le choix gagnant du round 1)
  → NEXT_PHASE (ou timer 60s)
  ← ROOM_UPDATE (round 2, game.phase: ANSWERING, nouveau scenario + question)
  ... même cycle ANSWERING → VOTING → RESULTS ...

ROUND 3 — Scénario IA (TWIST, basé sur toute l'histoire)
  → NEXT_PHASE (ou timer 60s)
  ← ROOM_UPDATE (round 3, game.phase: ANSWERING, nouveau scenario + question)
  ... même cycle ANSWERING → VOTING → RESULTS ...

FIN
  → NEXT_PHASE (ou timer 60s)
  ← ROOM_UPDATE (game.state: FINISHED, scenario: épilogue IA, question: "FIN.")
```

---

## Côté Front : quoi afficher selon l'état

### Par état de la room

| `state`   | `game`  | Écran à afficher                          |
| --------- | ------- | ----------------------------------------- |
| `WAITING` | `null`  | Lobby : liste des joueurs, bouton lancer  |
| `IN_GAME` | `{...}` | Écran de jeu (voir par phase ci-dessous)  |

### Par phase de jeu

| Phase       | Afficher                                                                          |
| ----------- | --------------------------------------------------------------------------------- |
| `ANSWERING` | `scenario` + `question` + input texte pour répondre + timer                       |
| `VOTING`    | `scenario` + `question` + liste des `answers` (anonymes) à sélectionner + timer   |
| `RESULTS`   | `results` avec username, réponse, nb de votes, badge winner + timer               |
| `FINISHED`  | `scenario` (= épilogue) + résultats finaux + bouton retour lobby                  |

### Éléments toujours visibles pendant une partie

- Numéro du round : `currentRound` / `maxRounds`
- Timer : calculé depuis `endTime`
- Liste des joueurs

### Gestion du host

Utiliser `hostId` pour :
- Afficher le bouton "Lancer la partie" uniquement au host (en `WAITING`)
- Afficher le bouton "Phase suivante" uniquement au host (optionnel, le timer gère la transition)

---

## Reconnexion

1. À la première connexion, **stocker le `playerId`** reçu dans le `CONNECTED`
2. Si la connexion WebSocket se ferme, ouvrir une nouvelle connexion
3. Envoyer immédiatement `{ "type": "RECONNECT", "payload": { "playerId": "..." } }`
4. Si la reconnexion réussit → le serveur renvoie un `ROOM_UPDATE` avec l'état complet
5. Si elle échoue (délai de 30s dépassé) → le serveur renvoie une `ERROR`

---

## Erreurs courantes

| Message                    | Cause                                           |
| -------------------------- | ----------------------------------------------- |
| `Invalid JSON`             | Message mal formaté                             |
| `Not in answering phase`   | `SUBMIT_ANSWER` envoyé hors de la phase réponse |
| `Not in voting phase`      | `SUBMIT_VOTE` envoyé hors de la phase vote      |
| `Answer already submitted` | Le joueur a déjà répondu ce round               |
| `Vote already submitted`   | Le joueur a déjà voté ce round                  |
| `Invalid answer index`     | Index hors du tableau `answers`                  |
| `Game is already finished` | `NEXT_PHASE` envoyé après la fin de partie      |
