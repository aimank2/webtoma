import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { PageStructure } from "@/types/interfaces"; // Import PageStructure

export default function Home() {
  const [extractedHtml, setExtractedHtml] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<PageStructure | null>(
    null
  ); // New state for structured data
  const [isLoadingHtml, setIsLoadingHtml] = useState<boolean>(false);
  const [isLoadingJson, setIsLoadingJson] = useState<boolean>(false); // New loading state for JSON
  const [error, setError] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  useEffect(() => {
    if (chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          setActiveTabId(tabs[0].id);
        } else {
          setError(
            "Could not get active tab ID. Ensure the extension has tab permissions and is running in a valid context."
          );
          console.error("Could not get active tab ID.");
        }
      });
    }
  }, []);

  const handleExtractPageSource = async () => {
    if (!chrome.scripting || !activeTabId) {
      const errorMessage =
        "Chrome scripting API is not available or active tab ID is missing. Ensure you are running this in an extension context with appropriate permissions.";
      setError(errorMessage);
      console.error(errorMessage, { scripting: chrome.scripting, activeTabId });
      return;
    }

    setIsLoadingHtml(true);
    setError(null);
    setExtractedHtml(null);
    setStructuredData(null); // Reset structured data as well

    try {
      const injectionResults = await chrome.scripting.executeScript<[], string>(
        {
          target: { tabId: activeTabId },
          func: () => document.documentElement.outerHTML,
        }
      );

      if (
        injectionResults &&
        injectionResults.length > 0 &&
        injectionResults[0].result
      ) {
        const rawHtml = injectionResults[0].result;
        setExtractedHtml(rawHtml);
        console.log("Extracted Page HTML:", rawHtml.substring(0, 500)); // Log a snippet
      } else {
        const scriptError =
          "Failed to extract page source. The script might have returned no result or an empty result.";
        console.error(scriptError, injectionResults);
        setError(scriptError);
      }
    } catch (e: any) {
      console.error("Error executing script to extract page source:", e);
      setError(`Error extracting page source: ${e.message}`);
    } finally {
      setIsLoadingHtml(false);
    }
  };

  const handleExtractStructuredData = async () => {
    if (!extractedHtml) {
      setError("Please extract the page HTML first");
      return;
    }

    setIsLoadingJson(true);
    setError(null);
    setStructuredData(null);

    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(extractedHtml, "text/html");

      // Helper function to get element attributes
      const getElementAttributes = (element: Element) => ({
        id: element.id || undefined,
        className: element.className || undefined,
        name: element.getAttribute("name") || undefined,
        dataTestId: element.getAttribute("data-testid") || undefined,
        text: element.textContent?.trim() || undefined,
      });

      // Helper function to extract element data recursively
      const extractElementData = (element: Element): any | null => {
        const tagName = element.tagName.toLowerCase();

        // Skip irrelevant elements
        if (["script", "style", "meta", "link", "noscript"].includes(tagName)) {
          return null;
        }

        const baseAttributes = getElementAttributes(element);

        switch (tagName) {
          case "input": {
            const input = element as HTMLInputElement;
            return {
              tag: "input",
              ...baseAttributes,
              type: input.type,
              value: input.value,
              checked:
                input.type === "checkbox" || input.type === "radio"
                  ? input.checked
                  : undefined,
              placeholder: input.placeholder || undefined,
              required: input.required,
              disabled: input.disabled,
            };
          }
          case "select": {
            const select = element as HTMLSelectElement;
            return {
              tag: "select",
              ...baseAttributes,
              value: select.value,
              required: select.required,
              disabled: select.disabled,
              multiple: select.multiple,
              options: Array.from(select.options).map((opt) => ({
                tag: "option",
                value: opt.value,
                text: opt.text,
                selected: opt.selected,
              })),
            };
          }
          case "textarea": {
            const textarea = element as HTMLTextAreaElement;
            return {
              tag: "textarea",
              ...baseAttributes,
              value: textarea.value,
              placeholder: textarea.placeholder || undefined,
              required: textarea.required,
              disabled: textarea.disabled,
              rows: textarea.rows,
              cols: textarea.cols,
            };
          }
          case "button": {
            const button = element as HTMLButtonElement;
            return {
              tag: "button",
              ...baseAttributes,
              type: button.type || "submit",
              disabled: button.disabled,
            };
          }
          case "label": {
            return {
              tag: "label",
              ...baseAttributes,
              htmlFor: element.getAttribute("for") || undefined,
            };
          }
          case "form": {
            const form = element as HTMLFormElement;
            return {
              tag: "form",
              ...baseAttributes,
              action: form.action || undefined,
              method: form.method as "GET" | "POST",
              children: Array.from(element.children)
                .map((child) => extractElementData(child))
                .filter(Boolean) as any[],
            };
          }
          case "fieldset": {
            return {
              tag: "fieldset",
              ...baseAttributes,
              disabled: (element as HTMLFieldSetElement).disabled,
              children: Array.from(element.children)
                .map((child) => extractElementData(child))
                .filter(Boolean) as any[],
            };
          }
          default:
            return null;
        }
      };

      // Extract all relevant form elements
      const formElements = Array.from(
        doc.querySelectorAll(
          "form, input, select, textarea, button, label, fieldset"
        )
      )
        .map((element) => extractElementData(element))
        .filter(Boolean) as any[];

      const pageStructure: PageStructure = {
        url: window.location.href,
        title: doc.title,
        timestamp: new Date().toISOString(),
        formStructure: formElements,
      };

      setStructuredData(pageStructure);
    } catch (e: any) {
      console.error("Error processing HTML to structured data:", e);
      setError(`Error processing HTML: ${e.message}`);
    } finally {
      setIsLoadingJson(false);
    }
  };

  return (
    <div className="container mx-auto  space-y-6 size-full ">
      <h1 className="text-2xl font-bold text-center">Page Data Extractor</h1>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Button
          onClick={handleExtractPageSource}
          disabled={isLoadingHtml || !activeTabId}
          className="w-full"
        >
          {isLoadingHtml ? "1. Extracting HTML..." : "1. Extract Page HTML"}
        </Button>
      </div>

      {extractedHtml && (
        <div className="space-y-4 p-4 border rounded-md bg-gray-500 mt-4">
          <h2 className="text-xl font-semibold">Extracted Page HTML</h2>
          <Textarea
            readOnly
            value={extractedHtml}
            className="h-40 font-mono text-xs"
            placeholder="HTML content of the active page will appear here..."
          />
          <Button
            onClick={handleExtractStructuredData}
            disabled={isLoadingJson || !activeTabId}
            className="w-full mt-2"
          >
            {isLoadingJson
              ? "2. Processing to JSON..."
              : "2. Extract Structured JSON"}
          </Button>
        </div>
      )}

      {structuredData && (
        <div className="space-y-4 border rounded-md bg-gray-500 mt-4">
          <h2 className="text-xl font-semibold">Structured Page Data (JSON)</h2>
          <Textarea
            readOnly
            value={JSON.stringify(structuredData, null, 2)}
            className="h-60 font-mono text-xs"
            placeholder="Structured JSON data will appear here..."
          />
        </div>
      )}

      {!extractedHtml && !isLoadingHtml && !isLoadingJson && !error && (
        <div className="text-center text-gray-500 py-10">
          <p>Click "1. Extract Page HTML" to begin.</p>
        </div>
      )}
    </div>
  );
}
