import { sanitizeForPrompt } from "../sanitize";

export type RoundNumber = 1 | 2 | 3;

export interface GameHistory {
	round1?: { scenario: string; winningAnswer: string };
	round2?: { scenario: string; winningAnswer: string };
}

export const SYSTEM_PROMPT = `Tu es le Maître du Jeu de "Chaos & Conséquences".

OUTPUT : JSON strict, deux champs uniquement.
{
  "scenario": "30 mots MAX. Situation qui découle DIRECTEMENT et mécaniquement du choix précédent. Ton : noir, trash, drôle, équilibré. Emojis obligatoires.",
  "question": "5 mots MAX. Ouverte. Exemples : 'Tu leur dis quoi ?', 'Tu le caches où ?', 'Tu réagis comment ?'"
}

RÈGLES ABSOLUES :
- Zéro texte hors JSON
- Le choix des joueurs est LA CAUSE. Le scénario est LA CONSÉQUENCE DIRECTE. Pas de sauts logiques.
- Jamais de questions oui/non
- Jamais "tu fais quoi" ou "que fais-tu"
- Aucun jugement, aucune morale
- L'absurde doit rester ancré dans une logique interne cohérente : les événements délirants ont des causes réelles`;

// const ROUND_CONFIG: Record<RoundNumber, { name: string; instruction: string }> =
// 	{
// 		1: {
// 			name: "HOOK",
// 			instruction: "Situation gênante du quotidien qui accroche immédiatement.",
// 		},
// 		2: {
// 			name: "ESCALADE",
// 			instruction:
// 				"Tout part en vrille à cause du choix précédent. Logique absurde mais cohérente.",
// 		},
// 		3: {
// 			name: "TWIST",
// 			instruction:
// 				"Plot twist brutal. S'appuie sur toute l'histoire. Chute inattendue mais logique.",
// 		},
// 	};

export function buildRound2Prompt(
	round1Scenario: string,
	round1WinningAnswer: string,
): string {
	const s = sanitizeForPrompt(round1Scenario);
	const c = sanitizeForPrompt(round1WinningAnswer);
	return `round=2 type=ESCALADE

RÈGLE PRINCIPALE : Le scénario doit OUVRIR sur le choix gagnant. Pas de transition, pas d'ellipse — on est dans la continuité immédiate.

STRUCTURE ATTENDUE :
1. Le choix "${c}" a une conséquence concrète et directe (visible, physique, sociale)
2. Cette conséquence déclenche une situation pire / plus embarrassante / plus délirante
3. La question porte sur ce nouveau problème, pas sur l'ancien

HISTOIRE :
- Situation de départ : ${s}
- Choix des joueurs : "${c}"

INTERDIT : Commencer le scénario sans mentionner ou impliquer directement "${c}".`;
}

export function buildRound3Prompt(history: GameHistory): string {
	if (!history.round1 || !history.round2) {
		throw new Error(
			"buildRound3Prompt: historique incomplet (round1 ou round2 manquant)",
		);
	}
	const s1 = sanitizeForPrompt(history.round1.scenario);
	const c1 = sanitizeForPrompt(history.round1.winningAnswer);
	const s2 = sanitizeForPrompt(history.round2.scenario);
	const c2 = sanitizeForPrompt(history.round2.winningAnswer);

	return `round=3 type=TWIST

RÈGLE PRINCIPALE : Le twist doit être la conséquence logique ET inattendue de TOUTE la chaîne. Pas un rebondissement décoratif — un retournement qui rend les rounds 1 et 2 rétrospectivement absurdes.

STRUCTURE ATTENDUE :
1. Le choix "${c2}" vient de provoquer quelque chose d'irréversible
2. Un élément du round 1 (scenario ou choix) resurface et change tout le sens de l'histoire
3. La chute est mémorable parce qu'elle était logiquement inévitable depuis le début

HISTOIRE COMPLÈTE :
- Round 1 : ${s1} → Choix : "${c1}"
- Round 2 : ${s2} → Choix : "${c2}"

INTERDIT : Inventer un personnage ou un élément absent des rounds précédents pour provoquer le twist.`;
}

export function buildConclusionPrompt(
	history: GameHistory,
	lastScenario: string,
	lastWinningAnswer: string,
): string {
	const s3 = sanitizeForPrompt(lastScenario);
	const c3 = sanitizeForPrompt(lastWinningAnswer);
	const historyLines: string[] = [];

	if (history.round1) {
		historyLines.push(
			`- Round 1 : ${sanitizeForPrompt(
				history.round1.scenario,
			)} → Choix : "${sanitizeForPrompt(history.round1.winningAnswer)}"`,
		);
	}
	if (history.round2) {
		historyLines.push(
			`- Round 2 : ${sanitizeForPrompt(
				history.round2.scenario,
			)} → Choix : "${sanitizeForPrompt(history.round2.winningAnswer)}"`,
		);
	}
	historyLines.push(`- Round 3 : ${s3} → Choix final : "${c3}"`);

	return `mode=conclusion type=EPILOGUE

RÈGLE PRINCIPALE : L'épilogue doit répondre à UNE question — "comment tout ça finit pour le personnage ?" La chute boucle l'histoire en 2-3 phrases max. Elle doit provoquer un "ah ouais logique" ou un "non c'est pas possible".

STRUCTURE ATTENDUE :
1. Conséquence finale du choix "${c3}"
2. Référence directe à au moins un élément du round 1 qui prend un sens ironique
3. Chute sèche et mémorable

HISTOIRE COMPLÈTE :
${historyLines.join("\n")}

Le champ "question" doit être "FIN." (c'est la conclusion, pas de suite).`;
}

export function buildRoundPrompt(
	round: RoundNumber,
	scenario: string,
	winningAnswer: string,
	history?: GameHistory,
): string {
	switch (round) {
		case 2:
			return buildRound2Prompt(scenario, winningAnswer);
		case 3:
			if (!history) {
				throw new Error("buildRoundPrompt round 3: history requis");
			}
			return buildRound3Prompt(history);
		default:
			throw new Error(
				`buildRoundPrompt: round ${round} non supporté (round 1 utilise un scénario prédéfini)`,
			);
	}
}
