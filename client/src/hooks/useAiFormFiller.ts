import { AuthContext } from "@/contexts/AuthContext";
import { ExtractedElement, AiFilledFormStructure } from "@/types/form";
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

    try {
      const apiResponse = await fetch(
        "http://localhost:3001/api/requests/openai/map-form", // This URL might need to be configurable
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
      console.log("AI response received", aiResult);
      return aiResult;
    } catch (error) {
      console.error("Error sending data to AI:", error);
      // Re-throw or return a specific error structure that the caller can handle
      throw error;
    }
  };

  return { sendToAI };
};
