import {
  BaseElement,
  ButtonElement,
  DOMElement,
  FieldSetElement,
  FormElement,
  InputElement,
  LabelElement,
  PageStructure,
  SelectElement,
  TextAreaElement,
} from "../types/interfaces";

function getElementAttributes(element: HTMLElement): Omit<
  BaseElement,
  "tag" | "children" | "elementType" | "rawOuterHTML"
> & {
  rawOuterHTML?: string;
} {
  const attributes: Omit<
    BaseElement,
    "tag" | "children" | "elementType" | "rawOuterHTML"
  > & { rawOuterHTML?: string } = {
    id: element.id || undefined,
    className: element.className || undefined,
    name: element.getAttribute("name") || undefined,
    dataTestId: element.getAttribute("data-testid") || undefined,
    ariaLabel: element.getAttribute("aria-label") || undefined,
    ariaLabelledBy: element.getAttribute("aria-labelledby") || undefined,
    ariaDescribedBy: element.getAttribute("aria-describedby") || undefined,
    isVisible: !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    ),
    // textContent is more specific to the element's direct text, not including children's text
    // For a more accurate 'text' that represents what a user sees, specific handling per element type might be needed
    // or consider element.innerText for visibility-aware text content.
    textContent:
      element.firstChild?.nodeType === Node.TEXT_NODE
        ? element.firstChild.textContent?.trim()
        : undefined,
  };
  // Limit rawOuterHTML length for performance and to avoid overly large JSON
  if (element.outerHTML.length < 1000) {
    attributes.rawOuterHTML = element.outerHTML;
  } else {
    attributes.rawOuterHTML =
      element.outerHTML.substring(0, 200) +
      "...[truncated]..." +
      element.outerHTML.substring(element.outerHTML.length - 50);
  }

  return Object.fromEntries(
    Object.entries(attributes).filter(([v]) => v !== undefined)
  ) as Omit<
    BaseElement,
    "tag" | "children" | "elementType" | "rawOuterHTML"
  > & { rawOuterHTML?: string };
}

function extractElementData(
  element: HTMLElement,
  depth: number = 0
): DOMElement | null {
  const MAX_DEPTH = 15; // Limit recursion depth to prevent performance issues on very_deep_pages
  if (depth > MAX_DEPTH) {
    console.warn("Max depth reached for element:", element);
    return null;
  }

  // Ignore script, style, meta, link, noscript, and comment nodes directly
  const tagName = element.tagName.toLowerCase();
  if (
    ["script", "style", "meta", "link", "noscript", "template"].includes(
      tagName
    ) ||
    element.nodeType === Node.COMMENT_NODE
  ) {
    return null;
  }

  const baseAttributes = getElementAttributes(element);
  let specificAttributes: Partial<DOMElement> = {}; // Use Partial here
  let elementType:
    | "InputElement"
    | "SelectElement"
    | "TextAreaElement"
    | "ButtonElement"
    | "LabelElement"
    | "FormElement"
    | "FieldSetElement"
    | "GenericElement" = "GenericElement"; // Default element type

  switch (tagName) {
    case "input": {
      const inputElement = element as HTMLInputElement;
      elementType = "InputElement";
      specificAttributes = {
        type: inputElement.type,
        value: inputElement.value,
        placeholder: inputElement.placeholder || undefined,
        required: inputElement.required,
        disabled: inputElement.disabled,
        checked:
          inputElement.type === "checkbox" || inputElement.type === "radio"
            ? inputElement.checked
            : undefined,
        pattern: inputElement.pattern || undefined,
        minLength:
          inputElement.minLength === -1 ? undefined : inputElement.minLength,
        maxLength:
          inputElement.maxLength === -1 ? undefined : inputElement.maxLength,
      } as Partial<InputElement>; // Cast to Partial of specific type
      break;
    }
    case "select": {
      const selectElement = element as HTMLSelectElement;
      elementType = "SelectElement";
      const options: any[] = Array.from(selectElement.options).map(
        (opt: HTMLOptionElement, index: number) => ({
          elementType: "OptionElement",
          tag: "option",
          ...getElementAttributes(opt), // Get base attributes for option
          value: opt.value,
          text: opt.text?.trim() || "", // Ensure text is always string
          selected: opt.selected,
          disabled: opt.disabled,
          index: index,
          rawOuterHTML:
            opt.outerHTML.length > 200
              ? opt.outerHTML.substring(0, 200) + "..."
              : opt.outerHTML,
        })
      );
      specificAttributes = {
        value: selectElement.value,
        multiple: selectElement.multiple,
        disabled: selectElement.disabled,
        required: selectElement.required,
        options: options,
      } as Partial<SelectElement>; // Cast to Partial of specific type
      break;
    }
    case "textarea": {
      const textAreaElement = element as HTMLTextAreaElement;
      elementType = "TextAreaElement";
      specificAttributes = {
        value: textAreaElement.value,
        placeholder: textAreaElement.placeholder || undefined,
        required: textAreaElement.required,
        disabled: textAreaElement.disabled,
        rows: textAreaElement.rows,
        cols: textAreaElement.cols,
        minLength:
          textAreaElement.minLength === -1
            ? undefined
            : textAreaElement.minLength,
        maxLength:
          textAreaElement.maxLength === -1
            ? undefined
            : textAreaElement.maxLength,
      } as Partial<TextAreaElement>; // Cast to Partial of specific type
      break;
    }
    case "button": {
      const buttonElement = element as HTMLButtonElement;
      elementType = "ButtonElement";
      specificAttributes = {
        buttonType: buttonElement.type || "submit", // Default button type
        text:
          buttonElement.textContent?.trim() ||
          element.getAttribute("value") ||
          undefined,
        disabled: buttonElement.disabled,
      } as Partial<ButtonElement>; // Cast to Partial of specific type
      break;
    }
    case "label": {
      const labelElement = element as HTMLLabelElement;
      elementType = "LabelElement";
      specificAttributes = {
        forField: labelElement.htmlFor || undefined,
        text: labelElement.textContent?.trim() || undefined,
      } as Partial<LabelElement>; // Cast to Partial of specific type
      break;
    }
    case "form":
      elementType = "FormElement";
      specificAttributes = {
        action: (element as HTMLFormElement).action || undefined,
        method: (element as HTMLFormElement).method || undefined,
        target: (element as HTMLFormElement).target || undefined,
        name:
          (element as HTMLFormElement).name || baseAttributes.name || undefined,
      } as Partial<FormElement>; // Cast to Partial of specific type
      break;
    case "fieldset":
      elementType = "FieldSetElement";
      specificAttributes = {
        disabled: (element as HTMLFieldSetElement).disabled,
        name:
          (element as HTMLFieldSetElement).name ||
          baseAttributes.name ||
          undefined,
      } as Partial<FieldSetElement>; // Cast to Partial of specific type
      break;
    default:
      // For other elements, capture as GenericElement if they are visible or have meaningful attributes
      if (
        (baseAttributes as any).isVisible ||
        baseAttributes.id ||
        baseAttributes.className ||
        element.getAttribute("role")
      ) {
        elementType = "GenericElement";
        specificAttributes = {
          // textContent for generic elements should be the most direct text
          text:
            element.firstChild?.nodeType === Node.TEXT_NODE
              ? element.firstChild.textContent?.trim()
              : element.textContent?.trim() || undefined,
        } as any;
      } else {
        return null; // Ignore other elements not explicitly handled or deemed non-interactive/non-structural
      }
  }

  const domElement: DOMElement = {
    ...baseAttributes,
    tag: tagName,
    elementType: elementType,
    ...specificAttributes,
  } as unknown as DOMElement; // Final cast to DOMElement

  // Recursively process children for container-like elements or elements that structurally group others
  // Avoid recursing into elements like <input> or <button> that don't typically have structured children in this context
  const containerTags = [
    "form",
    "fieldset",
    "div",
    "span",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "td",
    "th",
    "section",
    "article",
    "aside",
    "nav",
    "header",
    "footer",
    "main",
  ];
  if (containerTags.includes(tagName) && element.childNodes.length > 0) {
    const children: DOMElement[] = [];
    element.childNodes.forEach((childNode) => {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childElementData = extractElementData(
          childNode as HTMLElement,
          depth + 1
        );
        if (childElementData) {
          children.push(childElementData);
        }
      }
    });
    if (children.length > 0) {
      domElement.children = children;
    }
  }
  return domElement;
}

function getPageStructure(): PageStructure {
  const rootElement = document.body; // Start from body for main content
  const structuredElements: DOMElement[] = [];

  // Iterate over direct children of the body
  rootElement.childNodes.forEach((childNode) => {
    if (childNode.nodeType === Node.ELEMENT_NODE) {
      // Filter out script/style tags at the top level of body as well
      const tagName = (childNode as HTMLElement).tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tagName)) {
        return;
      }
      const elementData = extractElementData(childNode as HTMLElement);
      if (elementData) {
        structuredElements.push(elementData);
      }
    }
  });

  return {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now().toString(),
    formStructure: structuredElements, // This will be an array of top-level elements from the body
  };
}

// This is the entry point for the script execution
(() => {
  // Basic check to prevent multiple executions if the script is injected multiple times by mistake
  // A more robust solution might involve checking a specific global flag and its value.
  if ((window as any).__FORM_FILLER_HAS_RUN_STRUCTURE_EXTRACTOR__) {
    console.log(
      "StructuredFormExtractor already ran, returning previous result."
    );
    return (window as any).__FORM_FILLER_LAST_EXTRACTED_STRUCTURE__;
  }

  try {
    const structure = getPageStructure();
    (window as any).__FORM_FILLER_HAS_RUN_STRUCTURE_EXTRACTOR__ = true;
    (window as any).__FORM_FILLER_LAST_EXTRACTED_STRUCTURE__ = structure;
    return structure;
  } catch (error) {
    console.error("Error in structuredFormExtractor:", error);
    // Return an error object that can be caught by the caller
    return {
      error: `Extraction failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
})();
