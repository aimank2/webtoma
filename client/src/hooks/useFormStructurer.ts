import { ExtractedElement } from '@/types/form'; // Assuming the interface is in this path

export const useFormStructurer = () => {
  const structureForm = (html: string): ExtractedElement[] => {
    if (!html) {
      console.warn('HTML content is empty, cannot structure form.');
      return [];
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const formElements = Array.from(
        doc.querySelectorAll("input, textarea, select, button")
      );

      const structuredPageData: ExtractedElement[] = formElements.map(
        (el: Element) => {
          const inputElement = el as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | HTMLButtonElement;

          let labelText: string | undefined = undefined;
          if (inputElement.id) {
            const labelFor = doc.querySelector(
              `label[for='${inputElement.id}']`
            );
            if (labelFor) labelText = labelFor.textContent?.trim();
          }
          if (!labelText) {
            // Attempt to find a label that wraps the input or is an immediate parent
            const parentLabel = inputElement.closest("label");
            if (parentLabel) {
                // Get text content of the label, excluding text of nested input/select/textarea
                const clonedLabel = parentLabel.cloneNode(true) as HTMLLabelElement;
                clonedLabel.querySelectorAll("input, textarea, select, button").forEach(child => child.remove());
                labelText = clonedLabel.textContent?.trim();
            }
          }
          // Add more sophisticated label finding logic if needed (e.g., aria-labelledby)

          const baseExtractedElement: Omit<ExtractedElement, 'tag'> & { tag: string } = {
            tag: inputElement.tagName.toLowerCase(),
            attributes: Array.from(inputElement.attributes).reduce(
              (acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              },
              {} as { [key: string]: string }
            ),
            id: inputElement.id || undefined,
            name: (inputElement as HTMLInputElement).name || undefined,
            type: (inputElement as HTMLInputElement).type?.toLowerCase() || undefined,
            placeholder: (inputElement as HTMLInputElement).placeholder || undefined,
            label: labelText,
            text: inputElement.textContent?.trim() || null, // For buttons or other elements with direct text
            value: (inputElement as HTMLInputElement).value || undefined,
            required: (inputElement as HTMLInputElement).required || undefined,
          };

          if (baseExtractedElement.tag === 'select') {
            const selectElement = inputElement as HTMLSelectElement;
            const options = Array.from(selectElement.options).map(opt => ({
              label: opt.label || opt.text || opt.value,
              value: opt.value,
              text: opt.text, // It might be useful to keep original text as well
            }));
            return {
              ...baseExtractedElement,
              options: options,
            } as ExtractedElement; // Cast to ExtractedElement which should include options
          }

          return baseExtractedElement as ExtractedElement;
        }
      );
      console.log(`Form structured with ${structuredPageData.length} fields`);
      return structuredPageData;
    } catch (error) {
        console.error("Error structuring form:", error);
        return []; // Return empty array on error
    }
  };

  return { structureForm };
};