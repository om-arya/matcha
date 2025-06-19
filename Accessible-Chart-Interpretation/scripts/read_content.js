const synth = window.speechSynthesis;
let currentUtterance = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

readContent();

async function readContent() {
  const images = document.body.querySelectorAll("img");

  for (const image of images) {
    try {
      const text = await summarizeChartFromDOM(image);

      if (text !== "N/A" && text !== "ERR") {
        await ttsRead(text);
      }
    } catch (error) {
      console.error("Failed to process element:", error);
    }

    await sleep(1000);
  }
}

/**
 * Given a file path to an image, if the image is a chart,
 * returns a summary. Otherwise, returns "N/A".
 */
async function summarizeChartFromDOM(imgElement) {
  try {
    const imageUrl = new URL(imgElement.src, window.location.href).href;
    const { success, base64, type } = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: "fetchImageAsBlob",
        url: imageUrl,
      }, resolve);
    });

    if (!success) {
      throw new Error("Image fetch failed due to CORS.");
    }

    // Construct prompt
    const prompt = "You are a screen reader and came across this image. " +
      "If it is a data visualization (e.g. graph, chart, etc.): " +
          "Give 1-2 sentences about the main features of the visualization including the title (if applicable), " +
          "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). " +
          "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" " +
      "Otherwise: " +
          "Simply output \"N/A\"";

    const GEMINI_API_KEY = await new Promise((resolve, reject) => {
      chrome.storage.sync.get("GEMINI_API_KEY", (result) => {
        if (chrome.runtime.lastError || !result.GEMINI_API_KEY) {
          reject("API key not found");
        } else {
          resolve(result.GEMINI_API_KEY);
        }
      });
    });

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

    // Send to Gemini
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
    return data.candidates[0]?.content.parts[0]?.text || "ERR";
  } catch (err) {
    console.error("Summarization failed:", err);
    return "ERR";
  }
}

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