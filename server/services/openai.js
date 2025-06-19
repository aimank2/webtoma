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
    console.log(
      "mapUserInputToForm: UserInput:",
      JSON.stringify(userInput, null, 2)
    );
    console.log(
      "mapUserInputToForm: PageStructure:",
      JSON.stringify(pageStructure, null, 2)
    );
    const prePromptTemplate = ` 
 You are an intelligent agent that maps freeform user input to a structured web form for automated filling. 
 
 ## Context: 
 You are given two things: 
 1. **UserInput** – A freeform string. It may include names, emails, passwords, checkbox preferences, messages, or other details. The input may be ordered or unordered, formal or casual. 
 2. **PageStructure** – A parsed and typed DOM representation of a form (see below). It contains metadata about inputs, textareas, checkboxes, selects, buttons, and other elements with detailed field attributes. 
 
 ## Instructions: 
 - Parse the user input and extract all possible values. 
 - For each element in the "formStructure" (from PageStructure.formStructure), assign a value or status based on its type, label, and attributes. 
 - If the field type is: 
   - **input** (text, email, password, etc.): extract a suitable value. 
   - **textarea**: extract meaningful long-form content (if present). 
   - **checkbox**: infer intent from user input (e.g., “subscribe”, “yes”, “opt-in” → true). 
   - **select** or **radio**: infer selected value from user input matching available options. 
   - **button**: set type and status, but no need to map values. 
 - If no matching user data is found for a field, leave the value as "null" or "" and mark its status as "waiting". 
 - Each field should include: "type", "name", "value" (or "checked"), "label" (if available), and "status". 
 
 ## Inputs: 
 - UserInput: ${userInput} 
 - PageStructure (simplified): ${JSON.stringify(pageStructure, null, 2)} 
 
 ## Output Format: 
 Return a valid JSON of the following structure: 
 { 
   "status": "partial" | "completed" | "error", 
   "fields": [ 
     { 
       "type": "input" | "email" | "password" | "checkbox" | "textarea" | "select" | "radio" | "button", 
       "name": "fieldName", 
       "label": "Optional field label", 
       "value": "captured value" | null, 
       "checked": true | false, // Only for checkbox 
       "status": "filled" | "waiting" | "error", 
       "required": true | false, 
       "placeholder": "optional placeholder", 
       "options": [ // only for select or radio 
         { "label": "Option Label", "value": "optionValue" } 
       ] 
     } 
   ] 
 } 
    `;

    try {
      console.log("mapUserInputToForm: Sending request to OpenAI...");
      const response = await this.client.post("/chat/completions", {
        model: "o4-mini", // Ensure this model provides usage stats. gpt-3.5-turbo and gpt-4 models do.
        messages: [
          {
            role: "user",
            content: prePromptTemplate,
          },
        ],
        temperature: 1,
      });

      console.log(
        "mapUserInputToForm: OpenAI API Response Data:",
        JSON.stringify(response.data, null, 2)
      );

      const mappedForm = this.parseMappedFormResponse(response.data);

      // IMPORTANT: Include usage data in the return
      return {
        mappedForm,
        usage: response.data.usage, // Assuming 'usage' is directly available in response.data
      };
    } catch (error) {
      console.error(
        "OpenAI API Error (mapUserInputToForm):",
        error.response ? error.response.data : error.message
      );
      let errorMessage = "Failed to map user input to form with OpenAI.";
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
