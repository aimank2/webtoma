import { AuthContext } from "@/contexts/AuthContext";
import { ExtractedElement, AiFilledFormStructure } from "@/types/form"; // Ensure SelectElement is imported if not already
import { SelectElement } from "@/types/interfaces";
import { useContext } from "react";

export const useAiFormFiller = () => {
  const auth = useContext(AuthContext);

  const sendToAI = async (
    userInput: string,
    structuredForm: ExtractedElement[]
  ): Promise<AiFilledFormStructure> => {
    if (!auth || !auth.token) {
      console.error(
        "Authentication Error: User not logged in or token expired."
      );
      // Consider how to handle this: throw error, or return a specific error structure
      throw new Error("User not authenticated");
    }

    // Log data being sent to AI
    console.log("useAiFormFiller: Sending to AI - User Input:", userInput);
    console.log(
      "useAiFormFiller: Sending to AI - Structured Form (first 5 fields shown for brevity):",
      structuredForm
        // .slice(0, 5) // This slices the whole array of fields, not options within a field
        .map((f) => ({
          tag: f.tag,
          name: f.name,
          id: f.id,
          // THIS IS THE CRITICAL PART FOR SELECT OPTIONS:
          options:
            f.tag === "select"
              ? (f as unknown as SelectElement).options?.slice(0, 3) // Slices options for brevity if they exist
              : undefined,
        }))
    );
    // For more detail on a specific select, you might log it fully:
    // console.log("useAiFormFiller: Sending to AI - Full Structured Form:", JSON.stringify(structuredForm, null, 2));

    try {
      const apiResponse = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/requests/openai/map-form`, // This URL might need to be configurable
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            pageStructure: { formStructure: structuredForm },
            userInput: userInput,
          }),
        }
      );

      if (!apiResponse.ok) {
        let errorData;
        try {
          errorData = await apiResponse.json();
        } catch (e) {
          console.error("Error parsing error response from AI service:", e);
          errorData = {
            message: "Failed to parse error response from AI service.",
            status: apiResponse.status,
          };
        }
        console.error("AI API Error Data:", errorData);
        throw new Error(
          `AI service request failed: ${
            errorData.message || apiResponse.statusText
          }`
        );
      }

      const aiResult: AiFilledFormStructure = await apiResponse.json();

      // Log data received from AI
      console.log(
        "useAiFormFiller: AI Response Received - Full:",
        JSON.stringify(aiResult, null, 2)
      );

      // Specifically log details for select fields in the AI response
      if (aiResult && aiResult.fields) {
        console.log("useAiFormFiller: Processing AI response fields:");
        aiResult.fields.forEach((field) => {
          if (field.tag === "select") {
            console.log(
              `  AI Response for SELECT field (Name: ${
                field.name || "N/A"
              }, ID: ${field.id || "N/A"}): AI wants to set value = '${
                field.value
              }'`
            );
            // Find the original select element sent to the AI to compare options
            const originalSelectField = structuredForm.find(
              (sf) =>
                sf.tag === "select" &&
                (sf.name === field.name || sf.id === field.id)
            ) as SelectElement | undefined;
            if (originalSelectField && originalSelectField.options) {
              console.log(
                `    Original options for this select were:`,
                originalSelectField.options.map((opt) => ({
                  text: opt.text,
                  value: opt.value,
                }))
              );
            }
          }
        });
      }

      return aiResult;
    } catch (error) {
      console.error("Error sending data to AI:", error);
      // Re-throw or return a specific error structure that the caller can handle
      throw error;
    }
  };

  return { sendToAI };
};
