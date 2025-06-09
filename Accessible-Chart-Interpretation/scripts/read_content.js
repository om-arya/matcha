const synth = window.speechSynthesis;
let currentUtterance = null;

readContent();

async function readContent() {
  const elements = document.body.querySelectorAll("*");

  for (const element of elements) {
    if (element.tagName === "IMG") {
      try {
        const text = await summarizeChartFromDOM(element);

        if (text !== "N/A") {
          await ttsRead(text);
        }
      } catch (error) {
        console.error("Failed to process element:", error);
      }
    }
  }
}

/**
 * Given a file path to an image, if the image is a chart,
 * returns a summary. Otherwise, returns "N/A".
 */
async function summarizeChartFromDOM(imgElement) {
  try {
    // Convert image URL to Blob
    const imageBlob = await fetchImageAsBlob(imgElement.src);
    const mimeType = imageBlob.type;

    // Convert Blob to base64
    const base64Image = await blobToBase64(imageBlob);

    // Construct prompt
    const prompt = `
      You are a screen reader and came across this image.
      If it is a data visualization (e.g. graph, chart, etc.):
          Give 1-2 sentences about the main features of the visualization including the title (if applicable),
          maximum(s), minimum(s), and general trend(s), as well as any key insight(s).
          Start it with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
      Otherwise:
          Simply output "N/A"
    `;

    // Prepare request body
    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
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
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "N/A";
    return text;
  } catch (err) {
    console.error("Summarization failed:", err);
    return "N/A";
  }
}

// Helper to fetch image from src to Blob
async function fetchImageAsBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch image");
  return await res.blob();
}

// Helper to convert Blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1]; // Strip data prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


function ttsRead(text) {
  return new Promise((resolve) => {
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "en-US";
    currentUtterance.onend = resolve;
    synth.speak(currentUtterance);
  });
}