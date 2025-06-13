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

      const result = await response.json();
      // Assuming your backend returns the AI response directly, not nested under 'data'
      // Based on server/routes/requests.js, it sends `mappedFormData` directly.
      setAiResponse(result);
      toast({ title: "Success", description: "Form data processed by AI." });

      // Optional: Fill the actual form on the page
      if (result.data && result.data.filledForm && chrome && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id) {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: (formDataToFill: ExtractedElement[]) => {
                formDataToFill.forEach((item) => {
                  let element: HTMLElement | null = null;
                  if (item.attributes?.id) {
                    element = document.getElementById(item.attributes.id);
                  } else if (item.attributes?.name) {
                    element = document.querySelector(
                      `[name="${item.attributes.name}"]`
                    );
                  }
                  // Add more selectors if needed (e.g., by label, placeholder)

                  if (element && typeof item.value === "string") {
                    if (
                      element.tagName === "INPUT" ||
                      element.tagName === "TEXTAREA"
                    ) {
                      (
                        element as HTMLInputElement | HTMLTextAreaElement
                      ).value = item.value;
                      // Dispatch input and change events to simulate user interaction
                      element.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                      element.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                    } else if (element.tagName === "SELECT") {
                      (element as HTMLSelectElement).value = item.value;
                      element.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                    }
                    // Add handling for other element types like checkboxes, radio buttons if needed
                  }
                });
              },
              args: [result.data.filledForm as ExtractedElement[]],
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
