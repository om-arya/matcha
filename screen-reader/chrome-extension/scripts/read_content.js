let GEMINI_API_KEY = null;

// Fetch the Gemini API key on load
const fetchGeminiApiKey = async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/get_gemini_api_key");
    GEMINI_API_KEY = await res.json();
  } catch (err) {
    console.error("Retrieving Gemini API key failed:", err);
    GEMINI_API_KEY = "ERR";
  }
};

fetchGeminiApiKey();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summarize-focused-image") {
    // Handle the case where API key isn't ready yet
    if (GEMINI_API_KEY === null) {
      ttsRead("Matcha is still loading, please try again in a moment.");
      return;
    }
    
    const focused = document.activeElement;
    if (focused && focused.tagName === "IMG") {
      summarizeChartFromDOM(focused).then(summary => {
        ttsRead(summary === "ERR" ? "There was an error summarizing this chart." : summary);
      });
    } else {
      ttsRead("Focus is not on an image element.");
    }
  }
});

/**
 * Given a file path to an image, if the image is a chart,
 * returns a summary. Otherwise, returns "N/A".
 */
async function summarizeChartFromDOM(imgElement) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "ERR") return "ERR";

  try {
    const imageUrl = new URL(imgElement.src, window.location.href).href;
    const { success, base64, type } = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "fetchImageAsBlob",
          url: imageUrl,
        },
        resolve
      );
    });

    if (!success) {
      console.error("Image fetch failed due to CORS.");
      return "ERR";
    }

    const prompt =
      "You are a screen reader and came across this image. " +
      "If it is a data visualization (e.g. graph, chart, etc.): " +
      "Give 1-2 sentences about the main features of the visualization including the title (if applicable), " +
      "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). " +
      "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" " +
      "Otherwise: " +
      "Simply output \"N/A\"";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: type,
                data: base64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ERR";
  } catch (err) {
    console.error("Summarization failed:", err);
    return "ERR";
  }
}

const synth = window.speechSynthesis;
let currentUtterance = null;

function ttsRead(text) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "speak", text }, (response) => {
      if (response && response.success) {
        resolve();
      } else {
        console.error("TTS failed");
        resolve();
      }
    });
  });
}