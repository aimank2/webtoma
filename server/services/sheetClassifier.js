class SheetClassifierService {
  constructor() {
    this.openaiService = require('./openai');
  }

  async classifyIntent(userPrompt) {
    const prompt = `Classify the following Google Sheets automation intent:
${userPrompt}

Possible intents:
- data_entry
- chart_generation
- sheet_modification
- unknown

Respond in JSON format with intent, confidence, and justification.`;

    const response = await this.openaiService.classifyIntent(prompt);
    return response;
  }
}

module.exports = new SheetClassifierService();