import {
  FormField,
  FormStructure,
  InputField,
  SelectField,
  CheckboxField,
  RadioField,
  TextAreaField,
  ButtonField,
} from "../types/interfaces";

const getLabelForElement = (element: HTMLElement): string => {
  // 1. Check for a <label> with a 'for' attribute matching the element's ID
  if (element.id) {
    const labelElement = document.querySelector(`label[for="${element.id}"]`);
    if (labelElement && labelElement.textContent) {
      return labelElement.textContent.trim();
    }
  }

  // 2. Check for aria-labelledby attribute
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement && labelElement.textContent) {
      return labelElement.textContent.trim();
    }
  }

  // 3. Check for aria-label attribute
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  // 4. Check if the element is wrapped by a <label>
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName.toLowerCase() === "label") {
      // Try to get text content of the label, excluding the input's own value/text if it's complex
      const clonedLabel = parent.cloneNode(true) as HTMLLabelElement;
      const inputClone = clonedLabel.querySelector(
        `#${element.id}, [name="${(element as HTMLInputElement).name}"]`
      );
      if (inputClone) inputClone.remove(); // Remove the input itself to get only label text
      if (clonedLabel.textContent) return clonedLabel.textContent.trim();
      break;
    }
    if (
      parent.tagName.toLowerCase() === "form" ||
      parent.tagName.toLowerCase() === "body"
    )
      break; // Don't go too high
    parent = parent.parentElement;
  }

  // 5. Check for a <label> that is an immediate sibling (less common for direct association without 'for')
  // This might be too broad or pick up unrelated labels, use with caution or more specific selectors

  return ""; // No label found
};

const extractFormFromPage = (): FormStructure => {
  const formElements = document.querySelectorAll(
    'input:not([type="hidden"]), textarea, select, button:not([type="button"])'
  );

  const fields: FormField[] = [];

  formElements.forEach((el, index) => {
    const element = el as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | HTMLButtonElement;
    const fieldType = element.type
      ? element.type.toLowerCase()
      : element.tagName.toLowerCase();
    const fieldName = element.name || element.id || `${fieldType}-${index}`;
    const fieldLabel = getLabelForElement(element);

    const baseFieldProps = {
      name: fieldName,
      label: fieldLabel,
      status: "waiting" as const,
      required: (element as HTMLInputElement).required ?? false,
    };

    switch (element.tagName.toLowerCase()) {
      case "input": {
        const inputElement = element as HTMLInputElement;
        const commonInputProps = {
          ...baseFieldProps,
          value: inputElement.value,
          placeholder: inputElement.placeholder || "",
        };
        if (
          [
            "text",
            "password",
            "email",
            "number",
            "tel",
            "date",
            "search",
            "url",
            "month",
            "week",
            "time",
            "datetime-local",
          ].includes(inputElement.type)
        ) {
          fields.push({
            ...commonInputProps,
            type: inputElement.type as InputField["type"],
          } as InputField);
        } else if (inputElement.type === "checkbox") {
          fields.push({
            ...baseFieldProps,
            type: "checkbox",
            checked: inputElement.checked,
          } as CheckboxField);
        } else if (inputElement.type === "radio") {
          fields.push({
            ...baseFieldProps,
            type: "radio",
            value: inputElement.value,
            // For radio groups, ideally group them by name later or let AI handle context
            options: [
              {
                label: fieldLabel || inputElement.value,
                value: inputElement.value,
              },
            ],
          } as RadioField);
        }
        // TODO: Add support for other input types like 'file', 'range', 'color' if needed
        break;
      }
      case "textarea": {
        const textAreaElement = element as HTMLTextAreaElement;
        fields.push({
          ...baseFieldProps,
          type: "textarea",
          value: textAreaElement.value,
          placeholder: textAreaElement.placeholder || "",
        } as TextAreaField);
        break;
      }
      case "select": {
        const selectElement = element as HTMLSelectElement;
        const options = Array.from(selectElement.options).map((opt) => ({
          label: opt.label || opt.text || opt.value, // opt.text for broader compatibility
          value: opt.value,
        }));
        fields.push({
          ...baseFieldProps,
          type: "select",
          value: selectElement.value,
          options,
        } as SelectField);
        break;
      }
      case "button": {
        const buttonElement = element as HTMLButtonElement;
        if (
          buttonElement.type === "submit" ||
          (buttonElement.type === "button" &&
            (buttonElement.name || buttonElement.id))
        ) {
          fields.push({
            ...baseFieldProps,
            type: buttonElement.type as ButtonField["type"],
            disabled: buttonElement.disabled,
          } as ButtonField);
        }
        break;
      }
    }
  });

  if (fields.length === 0) {
    console.warn(
      "Form Extractor: No relevant form elements found on the page."
    );
    return { status: "error", fields: [] };
  }
  console.log("Form Extractor: Successfully extracted fields:", fields);
  return { status: "pending", fields };
};

export { extractFormFromPage };
