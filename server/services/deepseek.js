const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiEndpoint = process.env.DEEPSEEK_API_ENDPOINT;
    this.client = axios.create({
      baseURL: this.apiEndpoint, // This is where DEEPSEEK_API_ENDPOINT is used
      headers: {
        'Authorization': `Bearer ${this.apiKey}`, // Correctly uses Bearer
        'Content-Type': 'application/json'
      }
    });
  }

  async processFormFilling(userInput, formStructure) {
    try {
      // Prepare the prompt for DeepSeek
      const prompt = this.constructPrompt(userInput, formStructure);

      // Make API call to DeepSeek
      const response = await this.client.post('/chat/completions', { // Ensure '/chat/completions' is here if not part of baseURL
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a form-filling assistant. Your task is to analyze user input and fill form fields according to the provided structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      // Parse and validate the response
      const filledForm = this.parseResponse(response.data, formStructure);
      return filledForm;

    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`Failed to process form with AI: ${error.message}`);
    }
  }

  constructPrompt(userInput, formStructure) {
    return JSON.stringify({
      task: 'Please fill out the following form based on the user input',
      userInput: userInput,
      formStructure: formStructure,
      instructions: 'Please provide the filled form values in a JSON format matching the original structure'
    });
  }

  parseResponse(apiResponse, originalStructure) {
    try {
      // Extract the AI's response
      const aiResponse = apiResponse.choices[0].message.content;
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(aiResponse);
      
      // Validate the response matches the original structure
      return this.validateAndFormatResponse(parsedResponse, originalStructure);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  validateAndFormatResponse(response, originalStructure) {
    // Implement validation logic to ensure the response matches the PageStructure format
    // and contains all required fields from the original structure
    
    // This is a basic implementation - enhance based on your specific needs
    return {
      url: originalStructure.url,
      title: originalStructure.title,
      timestamp: new Date().toISOString(),
      formStructure: response.formStructure || response
    };
  }
}

module.exports = new DeepSeekService();