import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AiResponseCardProps {
  aiResponse: any; // Or a more specific type for the AI response
  isLoadingAiResponse: boolean;
}

const AiResponseCard: React.FC<AiResponseCardProps> = ({
  aiResponse,
  isLoadingAiResponse,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. AI Processed Form Data</CardTitle>
        <CardDescription>
          This is the form data processed by the AI based on your input and the
          page structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="ai-response">AI Response (JSON)</Label>
          <Textarea
            id="ai-response"
            placeholder={
              isLoadingAiResponse
                ? "Waiting for AI response..."
                : "AI response will appear here..."
            }
            value={aiResponse ? JSON.stringify(aiResponse, null, 2) : ""}
            readOnly
            rows={10}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AiResponseCard;
