const axios = require("axios");

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.client = axios.create({
      baseURL: "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  // Existing processFormFillingWithOpenAI can remain or be deprecated
  // async processFormFillingWithOpenAI(userInput, formStructure) { ... }

  // New method for mapping with the detailed pre-prompt
  async mapUserInputToForm(userInput, pageStructure) {
    const systemMessage = {
      role: "system",
      content: `You are an AI that maps user input to web form fields. When generating random values, ensure they are realistic and match field types:
- email: valid format like user123@example.com
- password: strong password (8+ chars, mixed case, numbers, symbols)
- text: contextual text based on field name
- number: within min/max range if specified
- tel: valid phone format
- date: reasonable date
- checkbox: true/false
- select/radio: valid option from choices
- textarea: relevant paragraph

Always return valid JSON matching this schema exactly:
{
  "status": "completed",
  "fields": [{
    "type": "string",
    "name": "string",
    "value": "string",
    "checked": false,
    "status": "filled"
  }]
}`
    };

    const userMessage = {
      role: "user",
      content: `Map the following user input to the form fields. ${userInput.toLowerCase().includes("random") ? "Generate appropriate random values based on each field's type and context." : ""}

Form structure:
${JSON.stringify(pageStructure, null, 2)}

User input:
${userInput}`
    };

    try {
      const response = await this.client.post("/chat/completions", {
        model: "gpt-3.5-turbo-0125",
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response structure");
      }

      const mappedForm = JSON.parse(response.data.choices[0].message.content);

      if (!mappedForm?.status || !Array.isArray(mappedForm?.fields)) {
        throw new Error("Invalid form mapping structure");
      }

      return {
        mappedForm,
        usage: response.data.usage
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(`Failed to map user input to form with OpenAI. ${error.message}`);
    }
  }

  // New parsing method for the specific output format
  parseMappedFormResponse(apiResponse) {
    console.log(
      "parseMappedFormResponse: Received API Response:",
      JSON.stringify(apiResponse, null, 2)
    );
    try {
      if (
        !apiResponse ||
        !apiResponse.choices ||
        !apiResponse.choices[0] ||
        !apiResponse.choices[0].message ||
        !apiResponse.choices[0].message.content
      ) {
        console.error(
          "parseMappedFormResponse: Invalid API response structure. 'content' is missing.",
          apiResponse
        );
        throw new Error(
          "Invalid API response structure from OpenAI. Expected 'choices[0].message.content'."
        );
      }
      let aiMessage = apiResponse.choices[0].message.content;
      console.log(
        "parseMappedFormResponse: Raw aiMessage before processing:",
        aiMessage
      );

      // Remove markdown code block fences (e.g., ```json ... ```)
      aiMessage = aiMessage.replace(/^```json\s*|\s*```$/g, "");
      console.log(
        "parseMappedFormResponse: aiMessage after removing markdown fences:",
        aiMessage
      );

      // Attempt to remove JavaScript-style line comments
      aiMessage = aiMessage.replace(/\/\/.*$/gm, "");
      console.log(
        "parseMappedFormResponse: aiMessage after removing comments:",
        aiMessage
      );

      // Trim whitespace that could interfere with parsing
      aiMessage = aiMessage.trim();
      console.log(
        "parseMappedFormResponse: aiMessage after trimming:",
        aiMessage
      );

      if (aiMessage === "") {
        console.error(
          "parseMappedFormResponse: aiMessage is empty after processing. Cannot parse."
        );
        throw new Error(
          "AI message is empty after pre-processing, cannot parse JSON."
        );
      }

      console.log(
        "parseMappedFormResponse: Attempting to parse aiMessage:",
        aiMessage
      );
      const parsedJson = JSON.parse(aiMessage);
      console.log(
        "parseMappedFormResponse: Successfully parsed JSON:",
        parsedJson
      );

      if (
        !parsedJson ||
        typeof parsedJson.status !== "string" ||
        !Array.isArray(parsedJson.fields)
      ) {
        console.error(
          "AI response does not match expected mapped form structure:",
          parsedJson
        );
        throw new Error(
          "AI response format is incorrect. Expected { status: string, fields: array }."
        );
      }
      return parsedJson;
    } catch (error) {
      console.error(
        "Failed to parse OpenAI mapped form response:",
        error,
        "Raw AI Response Content (if available):",
        apiResponse && apiResponse.choices && apiResponse.choices[0]
          ? apiResponse.choices[0].message.content
          : "No content found in expected path",
        "Processed aiMessage before JSON.parse (if available):",
        typeof aiMessage !== "undefined"
          ? aiMessage
          : "aiMessage was not defined at point of error"
      );
      throw new Error(
        `Failed to parse AI mapped form response: ${error.message}`
      );
    }
  }

  // constructPrompt and parseResponse for the older PageStructure format can remain if still needed
  // constructPrompt(userInput, formStructure) { ... }
  // parseResponse(apiResponse, originalPageStructure) { ... }
}

module.exports = new OpenAIService();
