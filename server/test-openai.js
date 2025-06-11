require('dotenv').config(); // To load environment variables from .env, especially OPENAI_API_KEY
const openaiService = require('./services/openai');

async function testOpenAIFormFilling() {
  console.log('Testing OpenAI API form filling integration...');

  // 1. Define Sample User Input and Form Structure (PageStructure-like)
  const sampleUserInput = "My name is Jane Archer, my email is jane.archer@example.com, and I'd like to subscribe to your amazing newsletter and get a quote for web development services.";
  
  const samplePageStructure = {
    url: "http://example.com/contact",
    title: "Contact Us Form",
    timestamp: new Date().toISOString(),
    formStructure: [
      {
        tag: "input",
        type: "text",
        name: "contactFullName",
        id: "contactName",
        label: "Your Full Name"
      },
      {
        tag: "input",
        type: "email",
        name: "contactEmailAddress",
        id: "contactEmail",
        label: "Your Email Address"
      },
      {
        tag: "textarea",
        name: "inquiryDetails",
        id: "inquiryText",
        label: "Your Inquiry"
      },
      {
        tag: "input",
        type: "checkbox",
        name: "newsletterSubscription",
        id: "newsletterCheck",
        label: "Subscribe to newsletter"
      },
      {
        tag: "button",
        type: "submit",
        text: "Send Message"
      }
    ]
  };

  try {
    // 2. Call the OpenAI Service's form filling method
    console.log("Sending request to OpenAI API...");
    // The service expects the full PageStructure-like object
    const filledFormPageStructure = await openaiService.processFormFillingWithOpenAI(sampleUserInput, samplePageStructure);

    // 3. Log the Result
    console.log("\n--- OpenAI API Response (Processed Form Structure) ---");
    console.log(JSON.stringify(filledFormPageStructure, null, 2));

    if (filledFormPageStructure && filledFormPageStructure.formStructure && Array.isArray(filledFormPageStructure.formStructure)) {
      console.log("\nTest successful! The form data was processed by OpenAI.");
      console.log("Review the 'formStructure' array above to see if 'value' fields were added correctly.");
    } else {
      console.error("\nTest failed: The response from OpenAI service was not in the expected PageStructure format or formStructure was missing/not an array.");
    }

  } catch (error) {
    console.error("\n--- Error during OpenAI API Test ---");
    console.error("Error message:", error.message);
    // Axios errors often have a 'response' property with more details
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Data:", JSON.stringify(error.response.data, null, 2));
    }
    console.error("\nTest failed due to an error.");
  }
}

// Run the test
testOpenAIFormFilling();