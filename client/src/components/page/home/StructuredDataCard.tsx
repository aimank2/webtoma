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
interface ExtractedElement {
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  value?: string;
  children?: ExtractedElement[];
}

interface StructuredDataCardProps {
  structuredData: ExtractedElement[] | null;
  isLoading: boolean;
}

const StructuredDataCard: React.FC<StructuredDataCardProps> = ({
  structuredData,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Structured Page Data</CardTitle>
        <CardDescription>
          This is the structured representation of the HTML content from the
          active tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="structured-data">Structured Data (JSON)</Label>
          <Textarea
            id="structured-data"
            placeholder={
              isLoading
                ? "Loading structured data..."
                : "Structured data will appear here..."
            }
            value={
              structuredData ? JSON.stringify(structuredData, null, 2) : ""
            }
            readOnly
            rows={10}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StructuredDataCard;
