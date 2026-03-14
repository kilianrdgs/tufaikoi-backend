import { sanitizeForPrompt } from "../sanitize";

export type RoundNumber = 1 | 2 | 3;

export interface GameHistory {
	round1?: { scenario: string; winningAnswer: string };
	round2?: { scenario: string; winningAnswer: string };
}

export const SYSTEM_PROMPT = `Tu es le Maître du Jeu de "Chaos & Conséquences".

OUTPUT : JSON strict, deux champs uniquement.
{
  "scenario": "20 mots MAX. Situation absurde, noire, trash. Emojis obligatoires.",
  "question": "5 mots MAX. Ouverte. Ex: 'Tu leur dis quoi ?', 'Tu le caches où ?', 'Tu réagis comment ?'"
}

RÈGLES ABSOLUES :
- Zéro texte hors JSON
- Jamais de questions oui/non
- Jamais "tu fais quoi" ou "que fais-tu"
- Aucun jugement, aucune morale
- Ton : absurde, noir, trash, drôle`;

const ROUND_CONFIG: Record<RoundNumber, { name: string; instruction: string }> =
	{
		1: {
			name: "HOOK",
			instruction: "Situation gênante du quotidien qui accroche immédiatement.",
		},
		2: {
			name: "ESCALADE",
			instruction:
				"Tout part en vrille à cause du choix précédent. Logique absurde mais cohérente.",
		},
		3: {
			name: "TWIST",
			instruction:
				"Plot twist brutal. S'appuie sur toute l'histoire. Chute inattendue mais logique.",
		},
	};

export function buildRound2Prompt(
	round1Scenario: string,
	round1WinningAnswer: string,
): string {
	const s = sanitizeForPrompt(round1Scenario);
	const c = sanitizeForPrompt(round1WinningAnswer);

	return `round=2 type=ESCALADE
${ROUND_CONFIG[2].instruction}

HISTOIRE :
- Début : ${s}
- Choix des joueurs (OBLIGATOIRE comme déclencheur) : "${c}"

Le scénario DOIT partir directement de ce choix. Les joueurs doivent sentir que leur vote a tout causé.`;
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
${ROUND_CONFIG[3].instruction}

HISTOIRE COMPLÈTE :
- Round 1 : ${s1} → Choix : "${c1}"
- Round 2 : ${s2} → Choix : "${c2}"

Le twist DOIT réutiliser un élément oublié des rounds précédents et faire sentir que tout était lié depuis le début.`;
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

HISTOIRE COMPLÈTE :
${historyLines.join("\n")}

Génère l'ÉPILOGUE de cette histoire. Chute finale absurde et mémorable qui boucle toute l'histoire.
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
