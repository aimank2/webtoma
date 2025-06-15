import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import React, { useContext, useState } from "react";
// import { Loader2 } from "lucide-react"; // For spinner - Remove this line
import LoaderIcon from "@/assets/icons/LoaderIcon"; // Add this line

// Keep ExtractedElement if it's used by the structuring logic and AI response
interface ExtractedElement {
  tag: string;
  attributes?: { [key: string]: string };
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  label?: string;
  text: string | null;
  value?: string; // Current value from the page
  required?: boolean; // Added as per requirements
  // Add other fields if your AI or structuring logic needs them
}

// Interface for the AI's response (filled form structure)
interface AiFilledFormStructure {
  status: string; // e.g., 'success', 'partial', 'error'
  fields: ExtractedElement[]; // Fields with 'value' populated by AI
  // Potentially add a summary message from AI if provided
}

const Home: React.FC = () => {
  const [formDataInput, setFormDataInput] = useState<string>("");
  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const { toast } = useToast();
  const auth = useContext(AuthContext);

  // Combined function to handle the entire automation flow
  const handleRunAutomation = async () => {
    if (!formDataInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what the form should do.",
        variant: "destructive",
      });
      return;
    }

    if (!auth || !auth.token) {
      toast({
        title: "Authentication Error",
        description: "You are not logged in or your session has expired.",
        variant: "destructive",
      });
      return;
    }

    setIsAutomating(true);

    try {
      // 1. HTML Extraction
      const htmlContent = await new Promise<string | null>(
        (resolve, reject) => {
          if (chrome && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              if (activeTab && activeTab.id) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: activeTab.id },
                    func: () => document.documentElement.outerHTML,
                  },
                  (injectionResults) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "Error injecting script for HTML extraction:",
                        chrome.runtime.lastError.message
                      );
                      reject(
                        new Error(
                          `Failed to extract HTML: ${chrome.runtime.lastError.message}`
                        )
                      );
                      return;
                    }
                    if (
                      injectionResults &&
                      injectionResults[0] &&
                      injectionResults[0].result
                    ) {
                      resolve(injectionResults[0].result as string);
                    } else {
                      reject(
                        new Error("Could not extract HTML from the page.")
                      );
                    }
                  }
                );
              } else {
                reject(new Error("No active tab found."));
              }
            });
          } else {
            // Fallback for development (optional, or reject)
            console.warn(
              "Chrome tabs API not available. HTML extraction skipped in dev."
            );
            resolve(
              '<html><body><input name="dev_field" type="text" value="dev value"/></body></html>'
            ); // Mock HTML for dev
          }
        }
      );

      if (!htmlContent) {
        toast({
          title: "Error",
          description: "HTML content could not be extracted.",
          variant: "destructive",
        });
        setIsAutomating(false);
        return;
      }

      // 2. Structuring Data
      // This logic should be robust and match the ExtractedElement interface, including 'required'
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
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
            labelText = inputElement.closest("label")?.textContent?.trim();
          }

          return {
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
            type:
              (inputElement as HTMLInputElement).type?.toLowerCase() ||
              undefined,
            placeholder:
              (inputElement as HTMLInputElement).placeholder || undefined,
            label: labelText,
            text: inputElement.textContent?.trim() || null,
            value: (inputElement as HTMLInputElement).value || undefined, // Current value from page
            required: (inputElement as HTMLInputElement).required || undefined,
          };
        }
      );

      // 3. AI Request
      const apiResponse = await fetch(
        "http://localhost:3001/api/requests/openai/map-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            pageStructure: { formStructure: structuredPageData }, // Ensure this matches backend
            userInput: formDataInput,
          }),
        }
      );

      if (!apiResponse.ok) {
        let errorData;
        try {
          errorData = await apiResponse.json();
        } catch (e) {
          errorData = {
            message: "Failed to parse error response from AI service.",
            e,
          };
        }
        console.error("AI API Error Data:", errorData);
        throw new Error(
          `AI service request failed: ${
            errorData.message || apiResponse.statusText
          }`
        );
      }

      const aiResult: AiFilledFormStructure = await apiResponse.json();
      // Ensure aiResult matches AiFilledFormStructure, especially aiResult.fields

      // 4. Autofill Execution
      if (
        aiResult &&
        aiResult.fields &&
        Array.isArray(aiResult.fields) &&
        chrome &&
        chrome.tabs
      ) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id) {
            chrome.scripting.executeScript<[AiFilledFormStructure], void>({
              target: { tabId: activeTab.id },
              func: (formToFill) => {
                // ... (Keep the robust field filling script from previous steps here)
                // ... It should use formToFill.fields
                // ... It should include try/catch for each field, console.warn for errors
                // ... And the summary logging at the end.
                // For brevity, I'm not repeating the whole script, but it's the one we refined.
                console.log("Form filling script executed with:", formToFill);
                let fieldsProcessed = 0;
                let fieldsFilledSuccessfully = 0;
                let fieldsSkipped = 0;
                const warnings: string[] = [];

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
                      }, Name: ${name || "N/A"}, Label: ${
                        label || "N/A"
                      }, ID: ${itemId || attributes?.id || "N/A"})`;

                      // Element finding logic (ensure this is the robust version)
                      try {
                        const effectiveId = itemId || attributes?.id;
                        if (effectiveId) {
                          element = document.getElementById(effectiveId);
                        }
                        if (!element && name) {
                          element = document.querySelector(`[name="${name}"]`);
                        }
                        // ... (include all other finding strategies: attributes, label, placeholder etc.)
                        if (!element && attributes) {
                          let selector = tag || "";
                          for (const [key, val] of Object.entries(attributes)) {
                            if (key !== "id" && key !== "name") {
                              selector += `[${key}="${val}"]`;
                            }
                          }
                          if (selector && selector !== tag) {
                            element = document.querySelector(selector);
                          }
                        }
                        if (!element && label) {
                          const labels = Array.from(
                            document.querySelectorAll("label")
                          );
                          const matchingLabel = labels.find(
                            (l) =>
                              l.textContent?.trim().toLowerCase() ===
                              label.trim().toLowerCase()
                          );
                          if (matchingLabel) {
                            if (matchingLabel.htmlFor)
                              element = document.getElementById(
                                matchingLabel.htmlFor
                              );
                            else
                              element = matchingLabel.querySelector(
                                "input, select, textarea"
                              );
                            if (!element) {
                              let nextSibling =
                                matchingLabel.nextElementSibling;
                              while (nextSibling) {
                                if (
                                  nextSibling.matches("input, select, textarea")
                                ) {
                                  element = nextSibling as HTMLElement;
                                  break;
                                }
                                nextSibling = nextSibling.nextElementSibling;
                              }
                            }
                          }
                        }
                        if (!element && type && placeholder) {
                          element = document.querySelector(
                            `${
                              tag || "input"
                            }[type="${type}"][placeholder="${placeholder}"]`
                          );
                        }
                        if (!element && type && !placeholder && name) {
                          element = document.querySelector(
                            `${tag || "input"}[type="${type}"][name="${name}"]`
                          );
                        }
                      } catch (e: any) {
                        const warningMsg = `${fieldIdentifier}: Error during element search: ${e.message}`;
                        console.warn(warningMsg);
                        warnings.push(warningMsg);
                        fieldsSkipped++;
                        return;
                      }

                      if (!element) {
                        const warningMsg = `${fieldIdentifier}: Element not found on page.`;
                        console.warn(warningMsg);
                        warnings.push(warningMsg);
                        fieldsSkipped++;
                        return;
                      }

                      if (
                        (
                          element as
                            | HTMLInputElement
                            | HTMLTextAreaElement
                            | HTMLSelectElement
                        ).disabled
                      ) {
                        const warningMsg = `${fieldIdentifier}: Element is disabled. Skipping.`;
                        console.warn(warningMsg);
                        warnings.push(warningMsg);
                        fieldsSkipped++;
                        return;
                      }
                      if (
                        (element as HTMLInputElement | HTMLTextAreaElement)
                          .readOnly
                      ) {
                        const warningMsg = `${fieldIdentifier}: Element is readonly. Skipping.`;
                        console.warn(warningMsg);
                        warnings.push(warningMsg);
                        fieldsSkipped++;
                        return;
                      }

                      const tagName = element.tagName.toLowerCase();
                      const currentElementType = (
                        element as HTMLInputElement
                      ).type?.toLowerCase(); // Renamed to avoid conflict

                      if (value !== undefined && value !== null) {
                        // AI provided a value to set
                        if (tagName === "input") {
                          switch (currentElementType) {
                            case "checkbox": {
                              (element as HTMLInputElement).checked = [
                                "true",
                                "checked",
                                "on",
                                "yes",
                                1,
                              ].includes(String(value).toLowerCase());
                              break;
                            }
                            case "radio": {
                              if (name) {
                                const radioToSelect = document.querySelector(
                                  `input[type="radio"][name="${name}"][value="${value}"]`
                                ) as HTMLInputElement;
                                if (radioToSelect) radioToSelect.checked = true;
                                else {
                                  const warningMsg = `${fieldIdentifier}: Radio option with value '${value}' not found.`;
                                  console.warn(warningMsg);
                                  warnings.push(warningMsg);
                                  fieldsSkipped++;
                                  return;
                                }
                              } else {
                                if (
                                  (element as HTMLInputElement).value ===
                                  String(value)
                                )
                                  (element as HTMLInputElement).checked = true;
                                else {
                                  const warningMsg = `${fieldIdentifier}: Radio (no name) value mismatch. Expected '${
                                    (element as HTMLInputElement).value
                                  }', got '${value}'.`;
                                  console.warn(warningMsg);
                                  warnings.push(warningMsg);
                                  fieldsSkipped++;
                                  return;
                                }
                              }
                              break;
                            }
                            case "file": {
                              const warningMsgFile = `${fieldIdentifier}: File input filling is not supported. Skipping.`;
                              console.warn(warningMsgFile);
                              warnings.push(warningMsgFile);
                              fieldsSkipped++;
                              return;
                            }
                            default: {
                              (element as HTMLInputElement).value =
                                String(value);
                            }
                          }
                        } else if (
                          tagName === "textarea" ||
                          tagName === "select"
                        ) {
                          if (tagName === "select") {
                            const selectElement = element as HTMLSelectElement;
                            const optionExists = Array.from(
                              selectElement.options
                            ).some((opt) => opt.value === String(value));
                            if (!optionExists) {
                              const warningMsg = `${fieldIdentifier}: Option with value '${value}' not found in select. Skipping.`;
                              console.warn(warningMsg);
                              warnings.push(warningMsg);
                              fieldsSkipped++;
                              return;
                            }
                          }
                          (
                            element as HTMLTextAreaElement | HTMLSelectElement
                          ).value = String(value);
                        } else {
                          const warningMsg = `${fieldIdentifier}: Unsupported element tag '${tagName}'. Skipping.`;
                          console.warn(warningMsg);
                          warnings.push(warningMsg);
                          fieldsSkipped++;
                          return;
                        }

                        ["input", "change", "blur"].forEach((eventType) => {
                          element!.dispatchEvent(
                            new Event(eventType, {
                              bubbles: true,
                              cancelable: true,
                            })
                          );
                        });
                        element.style.backgroundColor = "#e6ffe6"; // Highlight filled field
                        fieldsFilledSuccessfully++;
                      } else if (
                        tagName === "button" &&
                        ((item as any).status === "click" ||
                          (type === "submit" &&
                            (item as any).status !== "waiting"))
                      ) {
                        // Handle button clicks even if value is null/undefined, based on AI's 'status'
                        (element as HTMLButtonElement).click();
                        console.log(`${fieldIdentifier}: Clicked button.`);
                        element.style.outline = "2px solid #4CAF50"; // Highlight clicked button
                        fieldsFilledSuccessfully++; // Count actions as success
                      } else {
                        // Value is null or undefined, and it's not a button to click
                        const warningMsg = `${fieldIdentifier}: No value provided by AI to fill and not a button action. Skipping.`;
                        console.warn(warningMsg);
                        warnings.push(warningMsg);
                        fieldsSkipped++;
                        return;
                      }
                    } catch (e: any) {
                      const itemIdentifier = `Field (Type: ${
                        item.type || "N/A"
                      }, Name: ${item.name || "N/A"}, Label: ${
                        item.label || "N/A"
                      }, ID: ${item.id || item.attributes?.id || "N/A"})`;
                      const errorMsg = `${itemIdentifier}: Error processing field: ${e.message}`;
                      console.warn(errorMsg);
                      warnings.push(errorMsg);
                      fieldsSkipped++;
                    }
                  });
                }
                // Summary Log
                console.log("--- Autofill Summary ---");
                console.log(`Total fields processed: ${fieldsProcessed}`);
                console.log(
                  `Successfully filled/actioned: ${fieldsFilledSuccessfully}`
                );
                console.log(`Skipped fields: ${fieldsSkipped}`);
                if (warnings.length > 0) {
                  console.warn("Warnings encountered:");
                  warnings.forEach((w) => console.warn(`- ${w}`));
                }
                // Potentially return a summary object to the main extension page if needed
                // return { fieldsProcessed, fieldsFilledSuccessfully, fieldsSkipped, warnings };
              },
              args: [aiResult],
            });
            toast({
              title: "Automation Complete",
              description: "Form filled successfully!",
            });
          } else {
            throw new Error("Could not find active tab for script injection.");
          }
        });
      } else {
        toast({
          title: "AI Response Issue",
          description: "AI did not return valid field data to fill.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Automation Error:", error);
      toast({
        title: "Automation Failed",
        description:
          error.message || "An unexpected error occurred during automation.",
        variant: "destructive",
      });
    } finally {
      setIsAutomating(false);
    }
  };

  return (
    <div className="size-full flex flex-center relative">
      <div className="fixed bottom-24 w-full px-4 flex flex-col  ">
        <div className="flex flex-row justify-between items-center">
          <Label htmlFor="formDataInput" className=" font-semibold">
            Your Instructions:
          </Label>{" "}
          <Button
            onClick={handleRunAutomation}
            disabled={isAutomating || !auth?.token}
            className="flex flex-center px-3 border border-input text-sm hover:bg-black  text-white  bg-black min-w-32"
          >
            {isAutomating ? (
              <>
                <LoaderIcon className="h-5 w-5 animate-spin" />
              </>
            ) : (
              "Automate ⚡"
            )}
          </Button>
        </div>
        <div className="relative p-2 border mt-1 rounded-2xl ">
          <Textarea
            id="formDataInput"
            value={formDataInput}
            onChange={(e) => setFormDataInput(e.target.value)}
            placeholder="e.g., 'Fill my name as John Doe, email as john.doe@example.com, and select 'Option 2' for preferences.'"
            rows={6}
            className="text-sm border-none overflow-hidden"
            disabled={isAutomating}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
