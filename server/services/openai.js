const axios = require("axios");

const systemPromptSheetTasks = `
You are a spreadsheet automation assistant.

Your job is to understand any user request—whether casual, formal, or vague—and convert it into a valid JSON array of task objects that can be executed using the Google Sheets API.

Each task must include:
- an "action" field (from the list of supported actions below)
- all required properties for that action

🧩 Supported actions:
- "createSheet" → { "title": string }

- "appendRows" → { "range": string, "values": string[][] }
- "updateValues" → { "range": string, "values": string[][] }
- "clearValues" → { "range": string }
- "createChart" → {
    "chartType": string,
    "title": string,
    "range": string,        // Must match a previously defined data range
    "position"?: string     // Optional cell position like "E2"
  }

📌 Sheet Creation:
- If the user doesn’t mention a sheet name, infer one based on context (e.g., "Personal Budget", "Task Log", "Sales Report").

📋 Data Entry (appendRows or updateValues):
- If the user asks for a report, table, tracker, log, budgeting sheet, etc., infer relevant columns and at least one row of example data.
- Ensure ranges match the shape of the data. For example, 1 header + 1 data row with 8 columns → range = "Sheet1!A1:H2".

📊 Chart Rules:
- Create charts only after defining data.
- Chart ranges must point to valid data from a previous task.
- The domain column must be a single column (e.g., A2:A10), and each data series must also be one column (e.g., B2:B10).

📐 Range Format:
- Always use full A1 notation with sheet name: "Sheet1!A1:H10"
- Never use open-ended or partial ranges (❌ "A1:", ❌ "A2:H")

🚫 Output Format:
- Return ONLY a raw JSON array of tasks
- Do NOT include markdown, code blocks, comments, or extra text
`;

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

  /**
   * FORM-FILLING (LEGACY FEATURE)
   */
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
}`,
    };

    const userMessage = {
      role: "user",
      content: `Map the following user input to the form fields. ${
        userInput.toLowerCase().includes("random")
          ? "Generate appropriate random values based on each field's type and context."
          : ""
      }

Form structure:
${JSON.stringify(pageStructure, null, 2)}

User input:
${userInput}`,
    };

    try {
      const response = await this.client.post("/chat/completions", {
        model: "gpt-3.5-turbo-0125",
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Invalid API response structure");

      const mappedForm = JSON.parse(content);

      if (!mappedForm?.status || !Array.isArray(mappedForm?.fields)) {
        throw new Error("Invalid form mapping structure");
      }

      return {
        mappedForm,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(`Failed to map user input to form: ${error.message}`);
    }
  }

  /**
   * SHEET TASK AUTOMATION (NEW FEATURE)
   */
  async mapPromptToSheetTasks(prompt) {
    try {
      const response = await this.client.post("/chat/completions", {
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: systemPromptSheetTasks },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });

      const raw = response.data.choices?.[0]?.message?.content;
      return this.cleanAndParseJSON(raw);
    } catch (error) {
      console.error("OpenAI Sheet Task Mapping Error:", error);
      throw new Error(`Failed to map prompt to sheet tasks: ${error.message}`);
    }
  }

  /**
   * Shared parser for cleaning and validating JSON from OpenAI
   */
  cleanAndParseJSON(rawText) {
    if (!rawText) throw new Error("Empty response from OpenAI");

    const cleaned = rawText
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error("Could not parse AI response as JSON.");
    }
  }
}

module.exports = new OpenAIService();
