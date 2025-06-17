import { AiFilledFormStructure } from "@/types/form";

export const useFormInjector = () => {
  const injectFields = async (data: AiFilledFormStructure): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (
        data &&
        data.fields &&
        Array.isArray(data.fields) &&
        chrome &&
        chrome.tabs &&
        chrome.scripting
      ) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id) {
            chrome.scripting.executeScript<
              [AiFilledFormStructure],
              // Define a more specific return type for the script's result
              { success?: boolean; error?: string; warnings?: string[], summary?: string }
            >(
              {
                target: { tabId: activeTab.id },
                // The function to be executed in the target tab
                func: (formToFill) => {
                  console.log(
                    "Form filling script executed with:",
                    formToFill
                  );
                  let fieldsProcessed = 0;
                  let fieldsFilledSuccessfully = 0;
                  let fieldsSkipped = 0;
                  const warnings: string[] = [];
                  let scriptErrorOccurred = false;

                  if (formToFill && formToFill.fields) {
                    formToFill.fields.forEach((item) => {
                      fieldsProcessed++;
                      try {
                        let element: HTMLElement | null = null;
                        const {
                          type,
                          name,
                          value,
                          placeholder,
                          label,
                          attributes,
                          id: itemId,
                          tag,
                        } = item;
                        const fieldIdentifier = `Field (Type: ${
                          type || "N/A" 
                        }, Name: ${name || "N/A"}, ID: ${
                          itemId || "N/A"
                        }, Label: ${label || "N/A"})`;

                        if (itemId) {
                          element = document.getElementById(itemId);
                        }
                        if (!element && name) {
                          const HACK_nameElements = Array.from(
                            document.getElementsByName(name)
                          ) as HTMLElement[];
                          if (HACK_nameElements.length > 0)
                            element = HACK_nameElements[0];
                        }
                        if (
                          !element &&
                          attributes &&
                          attributes["aria-label"]
                        ) {
                          element = document.querySelector(
                            `[aria-label="${attributes["aria-label"]}"]`
                          );
                        }
                        if (!element && label) {
                          const labels = Array.from(
                            document.querySelectorAll("label")
                          );
                          const foundLabel = labels.find(
                            (l) =>
                              l.textContent?.trim().toLowerCase() ===
                              label.toLowerCase()
                          );
                          if (foundLabel) {
                            if (foundLabel.htmlFor) {
                              element = document.getElementById(
                                foundLabel.htmlFor
                              );
                            } else {
                              element = foundLabel.querySelector(
                                "input, textarea, select"
                              );
                            }
                          }
                        }
                        if (!element && placeholder) {
                          element = document.querySelector(
                            `[placeholder="${placeholder}"]`
                          );
                        }
                        if (!element && type && tag === "input") {
                          const inputs = Array.from(
                            document.querySelectorAll(`input[type="${type}"]`)
                          ) as HTMLInputElement[];
                          if (inputs.length === 1) element = inputs[0];
                          // else if (inputs.length > 1) {
                          //   warnings.push(`Multiple inputs found for type ${type}. Cannot uniquely identify.`);
                          // }
                        }

                        if (element && value !== undefined) {
                          const elTag = element.tagName.toLowerCase();
                          if (elTag === "input" || elTag === "textarea") {
                            (
                              element as
                                | HTMLInputElement
                                | HTMLTextAreaElement
                            ).value = value;
                            fieldsFilledSuccessfully++;
                            // console.log(
                            //   `Successfully filled ${fieldIdentifier} with value: ${value}`
                            // );
                          } else if (elTag === "select") {
                            (element as HTMLSelectElement).value = value;
                            fieldsFilledSuccessfully++;
                            // console.log(
                            //   `Successfully selected ${fieldIdentifier} with value: ${value}`
                            // );
                          } else {
                            warnings.push(
                              `Element ${fieldIdentifier} is not an input, textarea, or select.`
                            );
                            fieldsSkipped++;
                          }
                        } else if (value === undefined) {
                          warnings.push(
                            `No value provided by AI for ${fieldIdentifier}.`
                          );
                          fieldsSkipped++;
                        } else {
                          warnings.push(
                            `Could not find element for ${fieldIdentifier}.`
                          );
                          fieldsSkipped++;
                        }
                      } catch (e: any) {
                        scriptErrorOccurred = true;
                        warnings.push(
                          `Error processing ${
                            item.name || item.id || "unknown field"
                          }: ${e.message}`
                        );
                        fieldsSkipped++;
                      }
                    });
                  }
                  const summary = `Form Filling: Processed: ${fieldsProcessed}, Filled: ${fieldsFilledSuccessfully}, Skipped/Errors: ${fieldsSkipped}`;
                  console.log(summary);
                  if (warnings.length > 0) {
                    console.warn("Warnings during form filling:", warnings);
                  }
                  if (scriptErrorOccurred) {
                    return { error: "Error during field injection script.", warnings, summary };
                  }
                  return { success: true, warnings, summary };
                },
                args: [data],
              },
              (injectionResults) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error injecting form filling script:",
                    chrome.runtime.lastError.message
                  );
                  reject(
                    new Error(
                      `Failed to inject script: ${chrome.runtime.lastError.message}`
                    )
                  );
                  return;
                }
                if (
                  injectionResults &&
                  injectionResults[0] &&
                  injectionResults[0].result
                ) {
                  const result = injectionResults[0].result;
                  if (result.summary) {
                    console.log("Content Script Summary:", result.summary);
                  }
                  if (result.warnings && result.warnings.length > 0) {
                    console.warn("Content Script Warnings:", result.warnings);
                  }
                  if (result.error) {
                    console.error(
                      "Error reported from content script:",
                      result.error
                    );
                    reject(new Error(result.error));
                  } else if (result.success) {
                    console.log(
                      "Form filling script executed successfully by content script."
                    );
                    resolve();
                  } else {
                    console.warn(
                      "Unexpected result from content script:",
                      result
                    );
                    resolve(); // Or reject, depending on desired strictness
                  }
                } else {
                  console.error(
                    "No result returned from content script injection, or script failed catastrophically."
                  );
                  reject(
                    new Error("No result from content script injection.")
                  );
                }
              }
            );
          } else {
            console.error("No active tab found for field injection.");
            reject(new Error("No active tab found."));
          }
        });
      } else {
        console.error(
          "Chrome API not available or data is invalid for field injection."
        );
        reject(new Error("Chrome API not available or invalid data."));
      }
    });
  };

  return { injectFields };
};