// Base interface for all captured HTML elements
export interface BaseElement {
  tag: string;
  id?: string;
  className?: string; // 'class' is a reserved keyword, so using className
  name?: string;
  children?: DOMElement[]; // For nesting
  text?: string; // For elements like <label>, <button>, <option>
  dataTestId: any;
  [key: string]: any;
}

// Specific element types extending BaseElement

export interface InputElement extends BaseElement {
  tag: "input";
  type?: string;
  value?: string | number;
  checked?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  [key: string]: any;

  // Add other relevant input attributes: min, max, step, pattern, etc.
}

export interface TextAreaElement extends BaseElement {
  tag: "textarea";
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  cols?: number;
  [key: string]: any;
}

export interface OptionElement extends BaseElement {
  tag: "option";
  value: string; // <option> always has a value, defaults to text if not set
  selected?: boolean;
  [key: string]: any;
  // 'text' content is inherited from BaseElement.label
}

export interface SelectElement extends BaseElement {
  tag: "select";
  value?: string | string[]; // Can be string for single select, string[] for multiple
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  options: OptionElement[]; // <select> must have options, so 'children' is specialized here
  [key: string]: any;
}

export interface ButtonElement extends BaseElement {
  tag: "button";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  [key: string]: any;

  // 'text' content is inherited from BaseElement.text
}

export interface LabelElement extends BaseElement {
  tag: "label";
  htmlFor?: string; // 'for' attribute
  [key: string]: any;

  // 'text' content is inherited from BaseElement.text
}

export interface FieldSetElement extends BaseElement {
  tag: "fieldset";
  disabled?: boolean;
  [key: string]: any;

  name?: string; // Fieldsets can have names
  // children are generic DOMElement[] as fieldsets can contain various elements
}

export interface FormElement extends BaseElement {
  tag: "form";
  action?: string;
  method?: "GET" | "POST";
  target?: string;
  [key: string]: any;

  name?: string; // Forms can have names
  // children are generic DOMElement[] as forms can contain various elements
}

// Union type for any of the supported DOM elements
export type DOMElement =
  | InputElement
  | TextAreaElement
  | SelectElement
  | ButtonElement
  | LabelElement
  | FormElement
  | FieldSetElement
  | OptionElement; // OptionElement is part of SelectElement but can be a DOMElement

// The root structure for the extracted page information
export interface PageStructure {
  url: string;
  title?: string;
  timestamp?: string; // ISO 8601 format preferably
  formStructure: DOMElement[];
  [key: string]: any;
  // Array of top-level relevant elements (e.g., forms or standalone fields)
}

// Previous FormField and FormStructure can be deprecated or adapted if needed
// For now, we focus on the new PageStructure and DOMElement types

/*
// Potentially keep or adapt old types if they serve a different, coexisting purpose
export interface FormField {
    id?: string;
    name?: string;
    type: string;
    label?: string;
    value?: string | boolean | string[];
    options?: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
}

export interface FormStructure {
    url: string;
    fields: FormField[];
    rawHtml?: string;
}
*/

export interface FormFieldBase {
  type: string; // General type of the field (e.g., "input", "select", "checkbox", etc.)
  name: string; // Field's name attribute
  label?: string; // Optional: Field label if available
  status: "filled" | "waiting" | "error"; // Status of the field
  required?: boolean; // Whether the field is required
}

export interface InputField extends FormFieldBase {
  type: "input" | "password" | "email" | "number" | "tel" | "date"; // Specific input types
  value: string | number | null; // User input value
  placeholder?: string; // Placeholder text
}

export interface SelectField extends FormFieldBase {
  type: "select";
  value: string | number | null; // Currently selected option
  options: { label: string; value: string | number }[]; // Available options
}

export interface CheckboxField extends FormFieldBase {
  type: "checkbox";
  checked: boolean; // Whether the checkbox is checked
}

export interface RadioField extends FormFieldBase {
  type: "radio";
  value: string | number | null; // Currently selected option
  options: { label: string; value: string | number }[]; // Available options
}

export interface TextAreaField extends FormFieldBase {
  type: "textarea";
  value: string; // Text content
  placeholder?: string; // Placeholder text
}

export interface ButtonField extends FormFieldBase {
  type: "button" | "submit" | "reset";
  disabled: boolean; // Whether the button is disabled
}

export type FormField =
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
