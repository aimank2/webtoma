import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import React, { useContext, useState } from "react";
// import { Loader2 } from "lucide-react"; // For spinner - Remove this line
import LoaderIcon from "@/assets/icons/LoaderIcon"; // Add this line
import { AnimatedList } from "@/components/magicui/animated-list";
import NotificationItem, {
  Item as NotificationItemProps,
} from "@/components/page/home/NotificationItem"; // Adjusted import for Item props
import {
  AUTOMATION_ERROR_NOTIFICATION,
  FORM_FILLING_NOTIFICATIONS,
  AI_RESPONSE_RECEIVED_NOTIFICATION,
  INJECTING_FORM_VALUES_NOTIFICATION,
  FORM_AUTOMATION_SUCCESS_NOTIFICATION, // Added this import
} from "@/constants/constants";

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
  const [displayedNotifications, setDisplayedNotifications] = useState<
    NotificationItemProps[]
  >([]);
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const notificationTimeouts = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllNotificationTimeouts = () => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];
  };

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
    setDisplayedNotifications([]); // Clear previous notifications
    clearAllNotificationTimeouts(); // Clear any lingering timeouts

    let currentDelay = 0;
    const initialNotifications = FORM_FILLING_NOTIFICATIONS;

    // Schedule initial notifications up to 'WAITING FOR AI'
    initialNotifications.forEach((notification, index) => {
      const delay = notification.time === "0ms" ? 0 :
                    parseInt(notification.time.replace("+", "").replace("ms", ""), 10) -
                    (index > 0 ? parseInt(initialNotifications[index - 1].time.replace("+", "").replace("ms", ""), 10) : 0);
      currentDelay += delay;

      const timeoutId = setTimeout(() => {
        setDisplayedNotifications((prev) => [...prev, notification]);
      }, currentDelay);
      notificationTimeouts.current.push(timeoutId);
    });

    try {
      // 1. HTML Extraction
      // Simulate delay for EXTRACTING_HTML if not covered by its own timeout logic
      // (Assuming actual operation takes time)
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
        clearAllNotificationTimeouts(); // Clear scheduled initial notifications
        setDisplayedNotifications((prev) => [
          ...prev.filter(n => n.name !== "WAITING FOR AI"), // Remove waiting if present
          AUTOMATION_ERROR_NOTIFICATION,
        ]);
        setIsAutomating(false);
        return;
      }
      // If EXTRACTING_HTML was the first, it's already displayed by timeout.
      // If it's very fast, the timeout might still be pending or just fired.

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
      // SENDING_TO_AI notification is handled by its timeout
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

      // AI Response received - Clear previous timeouts and update notifications
      clearAllNotificationTimeouts();

      // Determine notifications shown so far (up to SENDING_TO_AI)
      const waitingForAiIndex = initialNotifications.findIndex(n => n.name === "WAITING FOR AI");
      const baseNotifications = waitingForAiIndex > -1 ? initialNotifications.slice(0, waitingForAiIndex) : [...initialNotifications]; 
      // Ensure we don't include "WAITING FOR AI" if it was the last one scheduled by initial loop
      // Or, if AI is very fast, it might not have appeared yet.

      setDisplayedNotifications([
        ...baseNotifications.filter(n => n.name !== "WAITING FOR AI"), // Ensure WAITING FOR AI is not shown
        AI_RESPONSE_RECEIVED_NOTIFICATION,
      ]);

      // Schedule INJECTING_FORM_VALUES
      const injectTimeoutId = setTimeout(() => {
        setDisplayedNotifications((prev) => [
          ...prev,
          INJECTING_FORM_VALUES_NOTIFICATION,
        ]);
      }, 300); // 300ms delay
      notificationTimeouts.current.push(injectTimeoutId);

      // 4. Autofill Execution
      if (
        aiResult &&
        aiResult.fields &&
        Array.isArray(aiResult.fields) &&
        chrome &&
        chrome.tabs
      ) {
        await new Promise<void>((resolveScript, rejectScript) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && activeTab.id) {
              chrome.scripting.executeScript<
                [AiFilledFormStructure],
                void | { error?: string; success?: boolean }
              >(
                {
                  target: { tabId: activeTab.id },
                  func: (formToFill) => {
                    // ... (Keep the robust field filling script from previous steps here)
                    console.log("Form filling script executed with:", formToFill);
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
                          }, Name: ${name || "N/A"}, ID: ${itemId || "N/A"}, Label: ${label || "N/A"})`;

                          if (itemId) {
                            element = document.getElementById(itemId);
                          }
                          if (!element && name) {
                            const HACK_nameElements = Array.from(document.getElementsByName(name)) as HTMLElement[];
                            if (HACK_nameElements.length > 0) element = HACK_nameElements[0];
                          }
                          if (!element && attributes && attributes['aria-label']) {
                            element = document.querySelector(`[aria-label="${attributes['aria-label']}"]`);
                          }
                          if (!element && label) {
                            const labels = Array.from(document.querySelectorAll('label'));
                            const foundLabel = labels.find(l => l.textContent?.trim().toLowerCase() === label.toLowerCase());
                            if (foundLabel) {
                              if (foundLabel.htmlFor) {
                                element = document.getElementById(foundLabel.htmlFor);
                              } else {
                                element = foundLabel.querySelector('input, textarea, select');
                              }
                            }
                          }
                          if (!element && placeholder) {
                            element = document.querySelector(`[placeholder="${placeholder}"]`);
                          }
                          if (!element && type && tag === 'input') {
                             // More generic selector if others fail, could be risky
                            const inputs = Array.from(document.querySelectorAll(`input[type="${type}"]`)) as HTMLInputElement[];
                            // This might need a more sophisticated way to pick the right one if multiple exist
                            if(inputs.length === 1) element = inputs[0]; 
                          }

                          if (element && value !== undefined) {
                            const elTag = element.tagName.toLowerCase();
                            if (elTag === 'input' || elTag === 'textarea') {
                              (element as HTMLInputElement | HTMLTextAreaElement).value = value;
                              fieldsFilledSuccessfully++;
                              console.log(`Successfully filled ${fieldIdentifier} with value: ${value}`);
                            } else if (elTag === 'select') {
                              (element as HTMLSelectElement).value = value;
                              fieldsFilledSuccessfully++;
                              console.log(`Successfully selected ${fieldIdentifier} with value: ${value}`);
                            } else {
                              warnings.push(`Element ${fieldIdentifier} is not an input, textarea, or select.`);
                              fieldsSkipped++;
                            }
                          } else if (value === undefined) {
                             warnings.push(`No value provided by AI for ${fieldIdentifier}.`);
                             fieldsSkipped++;
                          } else {
                            warnings.push(`Could not find element for ${fieldIdentifier}.`);
                            fieldsSkipped++;
                          }
                        } catch (e: any) {
                          scriptErrorOccurred = true;
                          warnings.push(`Error processing ${item.name || item.id || 'unknown field'}: ${e.message}`);
                          fieldsSkipped++;
                        }
                      });
                    }
                    console.log(
                      `Form Filling Summary: Processed: ${fieldsProcessed}, Filled: ${fieldsFilledSuccessfully}, Skipped/Errors: ${fieldsSkipped}`
                    );
                    if (warnings.length > 0) {
                      console.warn("Warnings during form filling:", warnings);
                    }
                    if (scriptErrorOccurred) {
                        return { error: "Error during field injection script." };
                    }
                    return { success: true }; 
                  },
                  args: [aiResult],
                },
                (injectionResults) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error injecting form filling script:",
                      chrome.runtime.lastError.message
                    );
                    rejectScript(
                      new Error(
                        `Failed to inject script: ${chrome.runtime.lastError.message}`
                      )
                    );
                    return;
                  }
                  if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                    const result = injectionResults[0].result;
                    if (result.error) {
                        console.error("Error reported from content script:", result.error);
                        rejectScript(new Error(result.error));
                    } else if (result.success) {
                        console.log("Form filling script executed successfully by content script.");
                        resolveScript();
                    } else {
                        // Fallback if result structure is unexpected
                        console.warn("Unexpected result from content script:", result);
                        resolveScript(); // Or reject, depending on desired strictness
                    }
                  } else {
                    // This case might indicate the script itself had an unhandled exception
                    // or an issue with the injection mechanism not returning a result.
                    console.error("No result or unexpected result from form filling script injection.");
                    rejectScript(
                      new Error("No result from form filling script.")
                    );
                  }
                }
              );
            } else {
              rejectScript(new Error("No active tab found for script injection."));
            }
          });
        });

        // Schedule FORM_AUTOMATION_SUCCESS
        const successTimeoutId = setTimeout(() => {
          setDisplayedNotifications((prev) => [
            ...prev,
            FORM_AUTOMATION_SUCCESS_NOTIFICATION,
          ]);
        }, 300); // 300ms delay after injection notification is set
        notificationTimeouts.current.push(successTimeoutId);

        toast({
          title: "Automation Complete",
          description: "Form fields have been processed based on AI output.",
        });
      } else {
        // This case handles if aiResult is problematic or chrome.tabs not available
        // (though chrome.tabs check is less likely here if HTML extraction worked)
        throw new Error(
          "AI result was invalid or browser environment changed unexpectedly."
        );
      }
    } catch (error: any) {
      console.error("Automation Error:", error);
      toast({
        title: "Automation Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
      clearAllNotificationTimeouts(); // Clear any scheduled initial or success notifications
      
      // Update displayed notifications to show error
      // Keep notifications up to 'SENDING TO AI' if they were shown, then add error
      const waitingForAiIndexOnError = FORM_FILLING_NOTIFICATIONS.findIndex(n => n.name === "WAITING FOR AI");
      const baseNotificationsOnError = waitingForAiIndexOnError > -1 
                                     ? FORM_FILLING_NOTIFICATIONS.slice(0, waitingForAiIndexOnError) 
                                     : displayedNotifications.filter(n => 
                                         n.name !== "WAITING FOR AI" && 
                                         n.name !== AI_RESPONSE_RECEIVED_NOTIFICATION.name && 
                                         n.name !== INJECTING_FORM_VALUES_NOTIFICATION.name
                                       ); // Fallback if initial notifications didn't run far

      setDisplayedNotifications([
        ...baseNotificationsOnError.filter(n => n.name !== "WAITING FOR AI"),
        AUTOMATION_ERROR_NOTIFICATION,
      ]);
    } finally {
      setIsAutomating(false);
      // Do not clear timeouts here if success ones are meant to run
      // clearAllNotificationTimeouts(); // This was moved to start and error/success specific points
    }
  };

  // Remove the old hardcoded 'notifications' array
  // const notifications = [ ... ];

  return (
    <div className="size-full flex flex-center relative">
      <AnimatedList className="mt-14 overflow-y-auto overflow-x-hidden h-[55vh] hide-scrollbar">
        {displayedNotifications.map((notification, index) => (
          <NotificationItem
            key={`${notification.name}-${index}`}
            {...notification}
          />
        ))}
      </AnimatedList>

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
