// It's good practice to define shared interfaces in a central location.
// If you don't have a types directory or file, we can create one.
// For now, I'm assuming a path like this. Adjust if needed.

export interface ExtractedElement {
  tag: string;
  attributes?: { [key: string]: string };
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  label?: string;
  text?: string | null;
  value?: string; // Current value from the page
  required?: boolean;
  options?: Array<{ label: string; value: string; text?: string }>; // Add this line
  children?: ExtractedElement[]; // If you use children for other things
}

export interface AiFilledFormStructure {
  status: string; // e.g., 'success', 'partial', 'error'
  fields: ExtractedElement[]; // Fields with 'value' populated by AI
  // Potentially add a summary message from AI if provided
}
