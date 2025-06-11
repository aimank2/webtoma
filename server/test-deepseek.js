require('dotenv').config(); // To load environment variables from .env
const deepseekService = require('./services/deepseek');

async function testDeepSeek() {
  console.log('Testing DeepSeek API integration...');

  // 1. Define Sample User Input and Form Structure
  const sampleUserInput = "My name is John Doe, and my email is john.doe@example.com. I want to sign up for the newsletter.";
  
  const sampleFormStructure = {
    url: "http://example.com/signup",
    title: "Signup Form",
    timestamp: new Date().toISOString(),
    formStructure: [
      {
        tag: "input",
        type: "text",
        name: "fullName",
        id: "fullNameInput",
        label: "Full Name"
      },
      {
        tag: "input",
        type: "email",
        name: "emailAddress",
        id: "emailInput",
        label: "Email Address"
      },
      {
        tag: "input",
        type: "checkbox",
        name: "newsletterOptIn",
        id: "newsletterOptInCheckbox",
        label: "Subscribe to newsletter"
      },
      {
        tag: "button",
        type: "submit",
        text: "Submit"
      }
    ]
  };

  try {
    // 2. Call the DeepSeek Service
    console.log("Sending request to DeepSeek API...");
    const filledForm = await deepseekService.processFormFilling(sampleUserInput, sampleFormStructure);

    // 3. Log the Result
    console.log("\n--- DeepSeek API Response ---");
    console.log(JSON.stringify(filledForm, null, 2));

    if (filledForm && filledForm.formStructure) {
      console.log("\nTest successful! The form was processed.");
    } else {
      console.error("\nTest failed: The response from DeepSeek was not in the expected format.");
    }

  } catch (error) {
    console.error("\n--- Error during DeepSeek API Test ---");
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Data:", error.response.data);
    }
    console.error("\nTest failed due to an error.");
  }
}

// Run the test
testDeepSeek();