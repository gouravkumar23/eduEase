/**
 * Builds and manages AI prompts with templates and variables.
 */
export class PromptBuilder {
  private templates = new Map<string, string>();

  registerTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }

  build(templateName: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => variables[key] || '');
  }

  buildRaw(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => variables[key] || '');
  }
}

export const promptBuilder = new PromptBuilder();
