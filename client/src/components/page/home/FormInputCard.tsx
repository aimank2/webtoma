import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FormInputCardProps {
  formDataInput: string;
  setFormDataInput: (value: string) => void;
  handleFillForm: () => void;
  isLoadingAiResponse: boolean;
  structuredData: any; // Or a more specific type if available
}

const FormInputCard: React.FC<FormInputCardProps> = ({
  formDataInput,
  setFormDataInput,
  handleFillForm,
  isLoadingAiResponse,
  structuredData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. User Input for Form Filling</CardTitle>
        <CardDescription>
          Provide the data you want the AI to use to fill the form based on the structured data above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="form-data-input">Your Input</Label>
          <Textarea
            id="form-data-input"
            placeholder="e.g., Name: John Doe, Email: john.doe@example.com, Message: Hello there!"
            value={formDataInput}
            onChange={(e) => setFormDataInput(e.target.value)}
            rows={5}
          />
        </div>
        <Button onClick={handleFillForm} disabled={isLoadingAiResponse || !structuredData || !formDataInput} className="mt-4 w-full">
          {isLoadingAiResponse ? 'Processing...' : 'Fill Form with AI'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FormInputCard;