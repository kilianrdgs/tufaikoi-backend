function removeControlChars(str: string): string {
	let result = "";
	for (const char of str) {
		const code = char.charCodeAt(0);
		if (code >= 32 && code !== 127) {
			result += char;
		}
	}
	return result;
}

export function sanitizeForPrompt(input: string, maxLength = 200): string {
	return removeControlChars(input)
		.slice(0, maxLength)
		.replace(
			/\b(system|user|assistant|human|ignore|forget|instructions?)\s*:/gi,
			"",
		)
		.replace(/<[^>]*>/g, "")
		.replace(/`{3,}/g, "")
		.replace(/\s+/g, " ")
		.trim();
}
