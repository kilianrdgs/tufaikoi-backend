import {
	BedrockRuntimeClient,
	InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { SYSTEM_PROMPT } from "./prompts";

export interface ScenarioResult {
	scenario: string;
	question: string;
}

function extractJSON(text: string): { scenario: string; question: string } {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) {
		throw new Error("JSON introuvable dans la réponse IA");
	}
	return JSON.parse(match[0]);
}

const client = new BedrockRuntimeClient({
	region: process.env.AWS_REGION ?? "eu-west-3",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
	},
});

export async function generateScenarioFromPrompt(
	prompt: string,
): Promise<ScenarioResult> {
	console.log("Génération scénario IA...");

	const body = {
		anthropic_version: "bedrock-2023-05-31",
		max_tokens: 150,
		temperature: 0.7,
		system: SYSTEM_PROMPT,
		messages: [{ role: "user", content: prompt }],
	};

	const command = new InvokeModelCommand({
		modelId: "eu.anthropic.claude-sonnet-4-6",
		contentType: "application/json",
		accept: "application/json",
		body: JSON.stringify(body),
	});

	try {
		const response = await client.send(command);
		const responseBody = JSON.parse(new TextDecoder().decode(response.body));

		let text = responseBody.content[0].text;
		console.log("Réponse IA:", text);

		text = text
			.replace(/```json\n?/g, "")
			.replace(/```\n?/g, "")
			.trim();

		const parsed = extractJSON(text);
		return {
			scenario: parsed.scenario,
			question: parsed.question,
		};
	} catch (error) {
		console.error("Erreur génération scénario:", error);

		return {
			scenario: "La situation dégénère complètement",
			question: "Tu réagis comment ?",
		};
	}
}
