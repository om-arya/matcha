// Make all img elements focusable
const images = document.querySelectorAll('img:not([tabindex])');
images.forEach(img => {
  img.setAttribute('tabindex', '0');
});

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

let GEMINI_API_KEY = null;

async function getGeminiApiKey() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getGeminiApiKey" }, (response) => {
      if (response && response.apiKey) {
        GEMINI_API_KEY = response.apiKey;
        resolve(GEMINI_API_KEY);
      } else {
        resolve(null);
      }
    });
  });
}

(async () => {
  await getGeminiApiKey();
})();

function isApiKeyReady() {
  return GEMINI_API_KEY && GEMINI_API_KEY !== "ERR";
}

let currFocused;
let currSummary;
let isOnChart = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action } = message;
  if (!isApiKeyReady()) {
    ttsRead("Matcha is still loading, please try again in a moment.");
    return;
  }

  if (action === "summarize-chart") {
    isOnChart = false;
    handleSummarizeFocusedChart();
  } else if (action === "ask-question") {
    handleAskQuestion();
  }
});

async function handleSummarizeFocusedChart() {
  if (currFocused === document.activeElement && currSummary) {
    ttsRead(currSummary);
    return;
  }

  currFocused = document.activeElement;

  if (currFocused?.tagName === "IMG") {
    ttsRead("Generating summary...")
    const result = await summarizeChartFromDOM(currFocused);
    if (result === "ERR") {
      currSummary = "There was an error summarizing this data visualiziation.";
    } else if (result === "N/A") {
      currSummary = "This image is not a data visualization."
    } else {
      isOnChart = true;
      currSummary = result;
    }
  } else {
    currSummary = "Focus is not on an image element."
  }

  ttsRead(currSummary);
}

function handleAskQuestion() {
  if (!isOnChart) {
    ttsRead("A data visualization must be summarized before you ask a question.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    ttsRead("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  ttsRead("I'm listening. Please ask your question.")
    .then(() => recognition.start())
    .catch(err => {
      console.error("TTS error:", err);
      recognition.start();
    });

  recognition.onresult = async (event) => {
    try {
      const spokenQuestion = event.results[0][0].transcript;
      await ttsRead(`You asked: ${spokenQuestion}`);
      
      const imageUrl = new URL(currFocused.src, window.location.href).href;
      const { success, base64, type } = await fetchImageAsBase64(imageUrl);
      
      if (!success) {
        await ttsRead("There was a problem fetching the image.");
        return;
      }

      const prompt =
        `You are a screen reader looking at a data visualization image and were asked the following question: "${spokenQuestion}". ` +
        "Answer the question in a paragraph or shorter, using the content of the chart image. " +
        "You have already provided a summary of the chart image, so no need to do it again. You also do not need to repeat the question. Just answer the question." +
        "If the chart is unclear or the question is not answerable from the chart, say so.";

      const response = await geminiGenerateContent(base64, type, prompt, "gemini-2.5-flash");
      const answer = response || "I'm sorry, I couldn't answer that.";
      await ttsRead(answer);
    } catch (err) {
      console.error("Error processing question:", err);
      await ttsRead("There was an error processing your question.");
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    ttsRead("There was an error understanding your question.");
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");
  };
}

async function summarizeChartFromDOM(imgElement) {
  try {
    const imageUrl = new URL(imgElement.src, window.location.href).href;
    const { success, base64, type } = await fetchImageAsBase64(imageUrl);
    
    if (!success) return "ERR";

    const prompt =
      "You are a screen reader and came across this data visualization." +
      "Describe it in 1-2 sentences using simple, friendly language." +
      "Mention what kind of visualization it is, its title (if any), any highs and lows," +
      "and what the overall pattern seems to be. Start with \"A [visualization type] shows…\"" +
      "or \"A [visualization type] titled [title] shows…\"" +
      "If it is not a data visualization, say \"N/A\"."

    const summary = await geminiGenerateContent(base64, type, prompt, "gemini-2.5-flash");
    return summary || "ERR";
  } catch (err) {
    console.error("Error in summarizeChartFromDOM:", err);
    return "ERR";
  }
}

async function fetchImageAsBase64(imageUrl) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "fetchImageAsBlob", url: imageUrl }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error:", chrome.runtime.lastError);
        resolve({ success: false });
      } else {
        resolve(response || { success: false });
      }
    });
  });
}

async function geminiGenerateContent(base64, mimeType, prompt, model) {
  try {
    const res = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.error) {
      console.error("Gemini API error:", data.error);
      return null;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Gemini request failed:", err);
    return null;
  }
}

function ttsRead(text) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "speak", text }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error:", chrome.runtime.lastError);
      } else if (!response?.success) {
        console.error("TTS failed");
      }
      resolve();
    });
  });
}