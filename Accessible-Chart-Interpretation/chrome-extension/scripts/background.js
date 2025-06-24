chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    return true; // Keep the message channel open for async sendResponse
  }
});