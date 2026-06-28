/**
 * Splits large prompts into manageable chunks.
 * Future: Could use semantic chunking or token-based splitting.
 */
export class Chunker {
  splitByTokens(text: string, _maxTokens: number): string[] {
    // Placeholder: simple sentence-based splitting
    // Future: Use actual tokenizer (e.g., GPT tokenizer)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences;
  }

  splitByCharacters(text: string, maxChars: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      chunks.push(text.slice(i, i + maxChars));
    }
    return chunks;
  }
}

export const chunker = new Chunker();
