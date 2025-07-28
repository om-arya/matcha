let GEMINI_API_KEY = null;

async function getGeminiApiKey() {
  try {
    const response = await fetch("https://m2th8slkyd.execute-api.us-east-1.amazonaws.com/get_gemini_api_key");
    const responseText = await response.text();
    const body = JSON.parse(responseText);
    if (response.status !== 200) {
      console.log(`Retrieving Gemini API key failed: ${body.detail}`);
      return false;
    }
    
    const key = body.gemini_api_key;
    if (key) {
      GEMINI_API_KEY = key;
      console.log("Gemini API key fetched successfully");
      return true;
    }
  } catch (err) {
    console.error("Retrieving Gemini API key failed:", err);
  }
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchApiKeyWithRetry() {
  while (!GEMINI_API_KEY || GEMINI_API_KEY === "ERR") {
    const success = await getGeminiApiKey();
    if (success) {
      break;
    }
    console.log("Retrying to fetch Gemini API key...");
    await sleep(65000); // Wait 65 seconds before retry
  }
}

// Call once when the background script starts
fetchApiKeyWithRetry();

chrome.commands.onCommand.addListener((command) => {
  if (command === "summarize-chart") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "summarize-chart" });
    });
  }

  if (command === "ask-question") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "ask-question" });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getGeminiApiKey") {
    sendResponse({ apiKey: GEMINI_API_KEY });
  }

  if (request.action === "speak") {
    chrome.tts.speak(request.text, {
      lang: "en-US",
      enqueue: false,
      onEvent: (event) => {
        if (["end", "interrupted", "error"].includes(event.type)) {
          sendResponse({ success: true });
        }
      },
    });
  }

  if (request.action === "fetchImageAsBlob") {
    fetch(request.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          sendResponse({
            success: true,
            base64,
            type: blob.type,
          });
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error("Blob fetch error", err);
        sendResponse({ success: false });
      });
  }

  // Return true to indicate async sendResponse
  return true;
});