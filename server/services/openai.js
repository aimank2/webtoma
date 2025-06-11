const axios = require("axios");

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    // The base URL for OpenAI API
    this.client = axios.create({
      baseURL: "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async processFormFillingWithOpenAI(userInput, formStructure) {
    try {
      const prompt = this.constructPrompt(userInput, formStructure);

      const response = await this.client.post("/chat/completions", {
        model: "o4-mini", // As requested from the OpenAI documentation
        messages: [
          {
            role: "system",
            content:
              "You are a highly intelligent form-filling assistant. Your task is to analyze user input and the provided form structure, then accurately fill in the form fields. Return the filled form data as a JSON object that mirrors the input `formStructure` array, but with a `value` field added to each relevant input element containing the extracted information. Ensure all original fields from the input `formStructure` are present in your response, adding values where appropriate.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1, // Adjust temperature for creativity vs. determinism
      });

      const filledForm = this.parseResponse(response.data, formStructure);
      return filledForm;
    } catch (error) {
      console.error(
        "OpenAI API Error:",
        error.response ? error.response.data : error.message
      );
      let errorMessage = "Failed to process form with OpenAI AI.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.message
      ) {
        errorMessage += ` Details: ${error.response.data.error.message}`;
      }
      throw new Error(errorMessage);
    }
  }

  constructPrompt(userInput, formStructure) {
    // We'll send the form structure and user input as a JSON string within the user message.
    return JSON.stringify({
      task: "Please fill out the following form based on the user input. The output should be a JSON object representing the form structure with added `value` fields for the inputs that were filled.",
      userInput: userInput,
      formStructure: formStructure.formStructure, // Assuming formStructure is the PageStructure like object
      instructions:
        "Respond with a JSON object containing the `formStructure` array. Each element in the array that represents an input field should have a `value` key with the extracted data. If a field cannot be filled, omit the `value` key or set it to an empty string for that field. Maintain all original properties of each form element.",
    });
  }

  parseResponse(apiResponse, originalPageStructure) {
    try {
      const aiMessage = apiResponse.choices[0].message.content;
      const parsedAiJson = JSON.parse(aiMessage);

      // The AI should return an object, ideally with a key like 'formStructure' containing the array.
      // Or it might return the array directly if the prompt is very specific.
      // Let's assume it returns an object like { formStructure: [...] } or just [...] directly.
      let filledStructureArray = parsedAiJson.formStructure || parsedAiJson;

      if (!Array.isArray(filledStructureArray)) {
        console.error(
          "AI response was not an array or did not contain a formStructure array:",
          parsedAiJson
        );
        throw new Error(
          "AI response format is incorrect. Expected an array of form elements."
        );
      }

      // Reconstruct the PageStructure-like object with the AI's filled form data.
      return {
        url: originalPageStructure.url,
        title: originalPageStructure.title,
        timestamp: new Date().toISOString(),
        formStructure: filledStructureArray, // This is the array of form elements, hopefully with 'value' fields added by AI
      };
    } catch (error) {
      console.error(
        "Failed to parse OpenAI response:",
        error,
        "Raw AI Response:",
        apiResponse.choices[0].message.content
      );
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
