const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

let GEMINI_API_KEY = null;

// Fetch Gemini API key on load
(async function fetchGeminiApiKey() {
  try {
    const res = await fetch("http://127.0.0.1:8000/get_gemini_api_key");
    const data = await res.json();
    GEMINI_API_KEY = data.key || data; // Handle both {key: "..."} and "..." responses
  } catch (err) {
    console.error("Retrieving Gemini API key failed:", err);
    GEMINI_API_KEY = "ERR";
  }
})();

function isApiKeyReady() {
  return GEMINI_API_KEY && GEMINI_API_KEY !== "ERR";
}

let focused;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action } = message;
  if (!isApiKeyReady()) {
    ttsRead("Matcha is still loading, please try again in a moment.");
    return;
  }

  if (action === "summarize-focused-chart") {
    handleSummarizeFocusedChart();
  } else if (action === "ask-question") {
    handleAskQuestion();
  }
});

function handleSummarizeFocusedChart() {
  focused = document.activeElement;

  if (focused?.tagName === "IMG") {
    summarizeChartFromDOM(focused)
      .then(summary => {
        if (summary === "ERR") {
          summary = "There was an error summarizing this chart.";
        } else if (summary === "N/A") {
          summary = "This image is not a chart."
        }
        ttsRead(summary);
      })
      .catch(err => {
        console.error("Error in summarizeChartFromDOM:", err);
        ttsRead("There was an error summarizing this chart.");
      });
  } else {
    ttsRead("Focus is not on an image element.");
  }
}

function handleAskQuestion() {
  if (!focused) {
    ttsRead("A chart must be read before you ask a question.");
    return;
  }

  if (!(focused.tagName === "IMG")) {
    ttsRead("Focus is not on an image element.");
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

  ttsRead("I'm listening. Please ask your question about the chart.")
    .then(() => recognition.start())
    .catch(err => {
      console.error("TTS error:", err);
      recognition.start();
    });

  recognition.onresult = async (event) => {
    try {
      const spokenQuestion = event.results[0][0].transcript;
      await ttsRead(`You asked: ${spokenQuestion}`);
      
      const imageUrl = new URL(focused.src, window.location.href).href;
      const { success, base64, type } = await fetchImageAsBase64(imageUrl);
      
      if (!success) {
        await ttsRead("There was a problem fetching the image.");
        return;
      }

      const prompt =
        `You are looking at a data visualization image and were asked the following question: "${spokenQuestion}". ` +
        "Answer the question using the content of the chart image. " +
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
  ttsRead("Hello");
  try {
    const imageUrl = new URL(imgElement.src, window.location.href).href;
    const { success, base64, type } = await fetchImageAsBase64(imageUrl);
    
    if (!success) return "ERR";

    const prompt =
      "You are a screen reader and came across this image. " +
      "If it is a data visualization (e.g. graph, chart, etc.): " +
      "Give 1-2 sentences about the main features of the visualization including the title (if applicable), " +
      "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). " +
      "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" " +
      "Otherwise: Simply output \"N/A\"";

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