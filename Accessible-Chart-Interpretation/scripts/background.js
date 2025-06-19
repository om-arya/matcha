chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchImageAsBlob") {
    fetch(request.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          sendResponse({ success: true, base64, type: blob.type });
        };
        reader.onerror = () => sendResponse({ success: false });
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error("Fetch failed", err);
        sendResponse({ success: false });
      });

    return true; // Keep the message channel open for async sendResponse
  } else if (request.action === "speak") {
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