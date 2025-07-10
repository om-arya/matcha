chrome.commands.onCommand.addListener((command) => {
  if (command === "summarize-image") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "summarize-focused-image" });
    });
  }
});

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
    return true;
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
    return true;
  }
});