/**
 * Validates AI responses for structure, safety, and correctness.
 */
export class ResponseValidator {
  isValidJSON(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  extractJSON<T>(text: string): T | null {
    // Try to extract JSON from markdown code blocks or raw text
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as T;
      } catch {
        return null;
      }
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  containsSensitiveContent(_text: string): boolean {
    // Future: Implement PII detection, harmful content filtering
    return false;
  }
}

export const responseValidator = new ResponseValidator();
