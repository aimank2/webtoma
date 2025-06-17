import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface HtmlExtractionCardProps {
  htmlContent: string | null;
  extractHtml: () => void;
  isLoading: boolean;
  structureData: () => void; // Or () => Promise<void> if async
  canStructure: boolean;
}

const HtmlExtractionCard: React.FC<HtmlExtractionCardProps> = ({
  htmlContent,      // Changed from extractedHtml
  extractHtml,      // Changed from onExtractHtml
  isLoading,        // Changed from isLoadingHtml
  structureData,    // Added
  canStructure,     // Added
  // activeTabId was removed as it's not in the interface or passed from Home.tsx
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. HTML Content</CardTitle>
        <CardDescription>
          Extract HTML from the current active tab or view mock HTML for development.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={extractHtml} disabled={isLoading} className="w-full">
          {isLoading ? 'Extracting HTML...' : 'Extract/Refresh HTML from Active Tab'}
        </Button>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="html-content">Raw HTML Content</Label>
          <Textarea
            id="html-content"
            placeholder={isLoading ? "Loading HTML..." : "HTML content will appear here..."}
            value={htmlContent || ''} // Use htmlContent
            readOnly
            rows={10}
            className="min-h-[100px]"
          />
        </div>
        <Button onClick={structureData} disabled={!canStructure || isLoading} className="w-full">
          {isLoading ? 'Processing...' : 'Structure Extracted HTML'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HtmlExtractionCard;
