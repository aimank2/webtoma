interface FormFieldBase {
  type: string; // General type of the field (e.g., "input", "select", "checkbox", etc.)
  name: string; // Field's name attribute
  label?: string; // Optional: Field label if available
  status: "filled" | "waiting" | "error"; // Status of the field
  required?: boolean; // Whether the field is required
}

interface InputField extends FormFieldBase {
  type: "input" | "password" | "email" | "number" | "tel" | "date"; // Specific input types
  value: string | number | null; // User input value
  placeholder?: string; // Placeholder text
}

interface SelectField extends FormFieldBase {
  type: "select";
  value: string | number | null; // Currently selected option
  options: { label: string; value: string | number }[]; // Available options
}

interface CheckboxField extends FormFieldBase {
  type: "checkbox";
  checked: boolean; // Whether the checkbox is checked
}

interface RadioField extends FormFieldBase {
  type: "radio";
  value: string | number | null; // Currently selected option
  options: { label: string; value: string | number }[]; // Available options
}

interface TextAreaField extends FormFieldBase {
  type: "textarea";
  value: string; // Text content
  placeholder?: string; // Placeholder text
}

interface ButtonField extends FormFieldBase {
  type: "button" | "submit" | "reset";
  disabled: boolean; // Whether the button is disabled
}

type FormField =
  | InputField
  | SelectField
  | CheckboxField
  | RadioField
  | TextAreaField
  | ButtonField;

export interface FormStructure {
  status: "pending" | "partial" | "completed" | "error";
  fields: FormField[];
}
