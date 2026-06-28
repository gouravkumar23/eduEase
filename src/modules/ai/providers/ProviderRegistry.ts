import { logger } from '../../../core/logging';

export interface AIProvider {
  name: string;
  generate(prompt: string, options?: unknown): Promise<string>;
  isAvailable(): Promise<boolean>;
}

/**
 * Registry of AI providers.
 * Future providers: OpenAI, Claude, Gemini, local models, etc.
 */
export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private defaultProvider: string | null = null;

  register(provider: AIProvider, isDefault = false): void {
    this.providers.set(provider.name, provider);
    if (isDefault || !this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
    logger.info(`AI provider registered: ${provider.name}`);
  }

  get(name?: string): AIProvider | undefined {
    const providerName = name || this.defaultProvider;
    if (!providerName) return undefined;
    return this.providers.get(providerName);
  }

  getDefault(): AIProvider | undefined {
    return this.defaultProvider ? this.providers.get(this.defaultProvider) : undefined;
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();
