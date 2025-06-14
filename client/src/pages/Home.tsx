import React, { useState, useEffect, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import HtmlExtractionCard from "@/components/page/home/HtmlExtractionCard";
import StructuredDataCard from "@/components/page/home/StructuredDataCard";
import FormInputCard from "@/components/page/home/FormInputCard";
import AiResponseCard from "@/components/page/home/AiResponseCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/AuthContext"; // Import AuthContext
interface ExtractedElement {
  tag: string;
  attributes?: { [key: string]: string };
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  label?: string;
  text: string | null;
  value?: string;
}

const Home: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<
    ExtractedElement[] | null
  >(null);
  const [formDataInput, setFormDataInput] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const [isLoadingHtml, setIsLoadingHtml] = useState<boolean>(false);
  const [isLoadingStructuredData, setIsLoadingStructuredData] =
    useState<boolean>(false);
  const [isLoadingAiResponse, setIsLoadingAiResponse] =
    useState<boolean>(false);
  const { toast } = useToast();
  const auth = useContext(AuthContext);

  const extractHtml = useCallback(() => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          setIsLoadingHtml(true);
          chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              func: () => document.documentElement.outerHTML,
            },
            (injectionResults) => {
              setIsLoadingHtml(false);
              if (chrome.runtime.lastError) {
                console.error(
                  "Error injecting script:",
                  chrome.runtime.lastError.message
                );
                toast({
                  title: "Error",
                  description: `Failed to extract HTML: ${chrome.runtime.lastError.message}`,
                  variant: "destructive",
                });
                setHtmlContent(null);
                return;
              }
              if (
                injectionResults &&
                injectionResults[0] &&
                injectionResults[0].result
              ) {
                setHtmlContent(injectionResults[0].result as string);
              } else {
                setHtmlContent(null);
                toast({
                  title: "Error",
                  description: "Could not extract HTML from the page.",
                  variant: "destructive",
                });
              }
            }
          );
        } else {
          toast({
            title: "Error",
            description: "No active tab found.",
            variant: "destructive",
          });
        }
      });
    } else {
      // Fallback for development when not in extension environment
      console.warn("Chrome tabs API not available. Using mock HTML.");
      setHtmlContent(
        '<html><body><h1>Mock Content</h1><input type="text" name="mock_field" /><button>Submit</button></body></html>'
      );
      toast({
        title: "Dev Mode",
        description: "Chrome tabs API not available. Loaded mock HTML.",
      });
    }
  }, [toast]);

  useEffect(() => {
    // Automatically extract HTML when the component mounts
    extractHtml();
  }, [extractHtml]);

  const structureData = useCallback(async () => {
    if (!htmlContent) {
      toast({
        title: "Error",
        description: "No HTML content to structure.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingStructuredData(true);
    try {
      // In a real scenario, you might send this to a backend or use a client-side library for structuring.
      // For now, let's simulate a simple structuring process.
      // This is a placeholder. You'll need a proper HTML parsing and structuring logic here.
      // For example, using DOMParser and selecting relevant elements.
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const inputs = Array.from(
        doc.querySelectorAll("input, textarea, select, button")
      );
      const data: ExtractedElement[] = inputs.map((el) => ({
        tag: el.tagName.toLowerCase(),
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as { [key: string]: string }),
        id: el.id || undefined,
        name: (el as HTMLInputElement).name || undefined,
        type: (el as HTMLInputElement).type || undefined,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        label:
          el.closest("label")?.textContent?.trim() ||
          doc.querySelector(`label[for='${el.id}']`)?.textContent?.trim() ||
          undefined,
        text: el.textContent?.trim() || null,
      }));
      setStructuredData(data);
      toast({
        title: "Success",
        description: "HTML structured successfully (simulated).",
      });
    } catch (error) {
      console.error("Error structuring data:", error);
      toast({
        title: "Error",
        description: "Failed to structure HTML.",
        variant: "destructive",
      });
      setStructuredData(null);
    }
    setIsLoadingStructuredData(false);
  }, [htmlContent, toast]);

  const handleFillForm = async () => {
    if (!structuredData) {
      toast({
        title: "Error",
        description: "No structured data available to fill.",
        variant: "destructive",
      });
      return;
    }
    if (!formDataInput.trim()) {
      toast({
        title: "Warning",
        description: "Please provide input for the AI.",
        variant: "default",
      });
      return;
    }

    if (!auth || !auth.token) {
      toast({
        title: "Authentication Error",
        description: "You are not logged in or your session has expired.",
        variant: "destructive",
      });
      setIsLoadingAiResponse(false);
      return;
    }

    setIsLoadingAiResponse(true);
    setAiResponse(null);

    try {
      const response = await fetch(
        "http://localhost:3001/api/requests/openai/map-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`, // Use the token from AuthContext
          },
          body: JSON.stringify({
            // Ensure the key matches what the backend expects for pageStructure.formStructure
            // Based on your server/routes/requests.js, it expects `pageStructure` which contains `formStructure`
            pageStructure: { formStructure: structuredData },
            userInput: formDataInput,
          }),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e: any) {
          errorData = { message: "Failed to parse error response.", e };
        }
        // Log the full error response from the server for more details
        console.error("API Error Data:", errorData);
        throw new Error(
          `API request failed with status ${response.status}: ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json(); // This is the FormStructure like object
      setAiResponse(result);
      toast({ title: "Success", description: "Form data processed by AI." });

      // Fill the actual form on the page with the AI response
      // The 'result' is expected to be the FormStructure object from the backend
      if (
        result &&
        result.fields &&
        Array.isArray(result.fields) &&
        chrome &&
        chrome.tabs
      ) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id) {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: (formStructure: {
                status: string;
                fields: ExtractedElement[];
              }) => {
                if (formStructure && formStructure.fields) {
                  formStructure.fields.forEach((item) => {
                    let element: HTMLElement | null = null;
                    const {
                      type,
                      name,
                      value,
                      placeholder,
                      label,
                      attributes,
                      id: itemId,
                    } = item;

                    // 1. Try by ID (if provided in item.id or item.attributes.id)
                    const effectiveId = itemId || attributes?.id;
                    if (effectiveId) {
                      element = document.getElementById(effectiveId);
                    }

                    // 2. Try by name (if element not found and name is present)
                    if (!element && name) {
                      element = document.querySelector(`[name="${name}"]`);
                    }

                    // 3. Try by a combination of attributes for more specific targeting if needed
                    // This can be expanded based on common patterns
                    if (!element && attributes) {
                      let selector = item.tag || ""; // Start with tag if available
                      for (const [key, val] of Object.entries(attributes)) {
                        if (key !== "id" && key !== "name") {
                          // id and name already tried
                          selector += `[${key}="${val}"]`;
                        }
                      }
                      if (selector && selector !== item.tag) {
                        // only query if attributes were added
                        try {
                          element = document.querySelector(selector);
                        } catch (e) {
                          console.warn(
                            "Error with complex selector:",
                            selector,
                            e
                          );
                        }
                      }
                    }

                    // 4. Try by label text (if element still not found and label is present)
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
                        if (matchingLabel.htmlFor) {
                          element = document.getElementById(
                            matchingLabel.htmlFor
                          );
                        } else {
                          // Try to find an input/select/textarea as a child or sibling
                          element = matchingLabel.querySelector(
                            "input, select, textarea"
                          );
                          if (!element) {
                            let nextSibling = matchingLabel.nextElementSibling;
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
                    }

                    // 5. Fallback: If still not found, try a more generic query using type and placeholder
                    if (!element && type && placeholder) {
                      element = document.querySelector(
                        `${
                          item.tag || "input"
                        }[type="${type}"][placeholder="${placeholder}"]`
                      );
                    }
                    if (!element && type && !placeholder && name) {
                      // If placeholder is empty but name exists
                      element = document.querySelector(
                        `${item.tag || "input"}[type="${type}"][name="${name}"]`
                      );
                    }

                    if (element && value !== undefined && value !== null) {
                      const tagName = element.tagName.toLowerCase();
                      const inputType = (
                        element as HTMLInputElement
                      ).type?.toLowerCase();

                      if (tagName === "input") {
                        switch (inputType) {
                          case "checkbox":
                            (element as HTMLInputElement).checked = [
                              "true",
                              "checked",
                              "on",
                              "yes",
                              1,
                            ].includes(String(value).toLowerCase());
                            break;
                          case "radio":
                            // For radio buttons, we need to find the specific radio button with the matching value within its group
                            if (name) {
                              const radioToSelect = document.querySelector(
                                `input[type="radio"][name="${name}"][value="${value}"]`
                              ) as HTMLInputElement;
                              if (radioToSelect) radioToSelect.checked = true;
                            } else {
                              // if no name, assume this is the one if value matches
                              if (
                                (element as HTMLInputElement).value ===
                                String(value)
                              ) {
                                (element as HTMLInputElement).checked = true;
                              }
                            }
                            break;
                          case "file":
                            console.warn(
                              "File input filling is not supported for security reasons."
                            );
                            break;
                          default: // text, email, password, number, date, etc.
                            (element as HTMLInputElement).value = String(value);
                        }
                      } else if (
                        tagName === "textarea" ||
                        tagName === "select"
                      ) {
                        (
                          element as HTMLTextAreaElement | HTMLSelectElement
                        ).value = String(value);
                      }

                      // Dispatch events to simulate user interaction and trigger any attached listeners
                      ["input", "change", "blur"].forEach((eventType) => {
                        element!.dispatchEvent(
                          new Event(eventType, {
                            bubbles: true,
                            cancelable: true,
                          })
                        );
                      });
                      element.style.backgroundColor = "#e6ffe6"; // Highlight filled field
                    }

                    // Handle button clicks if status is 'click' or similar
                    if (
                      element &&
                      element.tagName.toLowerCase() === "button" &&
                      ((item as any).status === "click" ||
                        (type === "submit" &&
                          (item as any).status !== "waiting"))
                    ) {
                      if (
                        (element as HTMLButtonElement).type === "submit" &&
                        (item as any).status !== "waiting_for_submit"
                      ) {
                        console.log(
                          `Clicking button: ${label || name || itemId}`
                        );
                        (element as HTMLButtonElement).click();
                      }
                    }
                  });
                }
              },
              args: [result as { status: string; fields: ExtractedElement[] }], // Pass the whole AI response
            });
          }
        });
      }
    } catch (error) {
      console.error("Error filling form with AI:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      setAiResponse({ error: errorMessage });
      toast({
        title: "Error",
        description: `AI processing failed: ${errorMessage}`,
        variant: "destructive",
      });
    }
    setIsLoadingAiResponse(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        AI Form Filler Extension
      </h1>

      <HtmlExtractionCard
        htmlContent={htmlContent}
        extractHtml={extractHtml}
        isLoading={isLoadingHtml}
        structureData={structureData}
        canStructure={!!htmlContent}
      />

      <StructuredDataCard
        structuredData={structuredData}
        isLoading={isLoadingStructuredData}
      />

      <FormInputCard
        formDataInput={formDataInput}
        setFormDataInput={setFormDataInput}
        handleFillForm={handleFillForm}
        isLoadingAiResponse={isLoadingAiResponse}
        structuredData={structuredData}
      />

      <AiResponseCard
        aiResponse={aiResponse}
        isLoadingAiResponse={isLoadingAiResponse}
      />

      {/* For debugging or direct interaction with Chrome APIs if needed */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>
            <CardTitle>Dev Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => {
                if (chrome && chrome.runtime && chrome.runtime.getURL) {
                  console.log("Extension base URL:", chrome.runtime.getURL(""));
                } else {
                  console.log("Chrome runtime API not available.");
                }
              }}
            >
              Log Extension URL
            </Button>
            <p className="text-xs text-muted-foreground">
              Ensure you are running this in an unpacked extension environment
              for Chrome APIs to work.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;
