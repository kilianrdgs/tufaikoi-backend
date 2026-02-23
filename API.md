# API WebSocket - tufaikoi

## Connexion

```
ws://localhost:PORT
```

Chaque connexion WebSocket = un joueur. Le serveur identifie le joueur automatiquement via la connexion.

---

## Messages Client → Serveur

Tous les messages sont en JSON avec un champ `type`.

### 1. Créer une room

```json
{ "type": "CREATE_ROOM", "payload": { "username": "Kilian" } }
```

### 2. Rejoindre une room

```json
{ "type": "JOIN_ROOM", "payload": { "roomId": "1234", "username": "Lucas" } }
```

### 3. Quitter une room

```json
{ "type": "LEAVE_ROOM" }
```

### 4. Lancer la partie

```json
{ "type": "START_GAME" }
```

> Seul le host peut lancer la partie.

### 5. Soumettre une réponse (phase ANSWERING)

```json
{ "type": "SUBMIT_ANSWER", "payload": { "answer": "Ma réponse" } }
```

### 6. Voter pour une réponse (phase VOTING)

```json
{ "type": "SUBMIT_VOTE", "payload": { "answerIndex": 0 } }
```

> `answerIndex` = l'index de la réponse dans le tableau `answers` reçu dans le `ROOM_UPDATE`.

### 7. Passer à la phase suivante

```json
{ "type": "NEXT_PHASE" }
```

---

## Messages Serveur → Client

### ROOM_UPDATE

Envoyé à **tous les joueurs de la room** après chaque action. C'est le seul message de mise à jour.

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

```json
{
  "type": "ERROR",
  "payload": { "message": "Not in answering phase" }
}
```

---

## Objet `game` dans ROOM_UPDATE

Quand une partie est en cours (`state: "IN_GAME"`), le champ `game` contient :

```json
{
  "state": "PLAYING",
  "phase": "ANSWERING",
  "currentRound": 1,
  "maxRounds": 3,
  "question": "Quelle est la chose la plus drôle que tu aies faite ?",
  "answers": null,
  "results": null
}
```

### Données par phase

| Phase       | `answers`                       | `results`       |
| ----------- | ------------------------------- | --------------- |
| `ANSWERING` | `null`                          | `null`          |
| `VOTING`    | `["réponse1", "réponse2", ...]` | `null`          |
| `RESULTS`   | `null`                          | `RoundResult[]` |

### RoundResult

```json
{
  "username": "Lucas",
  "answer": "Ma réponse",
  "votes": 3,
  "isWinner": true
}
```

---

## Flow complet d'une partie

```
1. CREATE_ROOM        → ROOM_UPDATE (state: WAITING, game: null)
2. JOIN_ROOM           → ROOM_UPDATE (2 joueurs)
3. START_GAME          → ROOM_UPDATE (state: IN_GAME, game.phase: ANSWERING)
4. SUBMIT_ANSWER x2    → ROOM_UPDATE (réponses stockées côté serveur)
5. NEXT_PHASE          → ROOM_UPDATE (game.phase: VOTING, answers: [...])
6. SUBMIT_VOTE x2      → ROOM_UPDATE (votes stockés côté serveur)
7. NEXT_PHASE          → ROOM_UPDATE (game.phase: RESULTS, results: [...])
8. NEXT_PHASE          → ROOM_UPDATE (round 2, game.phase: ANSWERING)
   ... répéter pour chaque round ...
9. NEXT_PHASE (round 3)→ ROOM_UPDATE (game.state: FINISHED)
```

---

## Côté Front : quoi afficher selon la phase

| Phase       | Afficher                                                        |
| ----------- | --------------------------------------------------------------- |
| `ANSWERING` | La question + un input pour écrire sa réponse                   |
| `VOTING`    | La liste des `answers` (anonymes) + sélectionner un index       |
| `RESULTS`   | Les `results` avec username, réponse, nb de votes, et le winner |
| `FINISHED`  | Écran de fin / scores finaux                                    |
