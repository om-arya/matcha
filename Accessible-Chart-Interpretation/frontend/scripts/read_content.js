const synth = window.speechSynthesis;
let currentUtterance = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

readContent();

GEMINI_API_KEY = "AIzaSyCFJ_mWfpkTvYzriuqKLjlPDjvcrYqFyyk";

async function readContent() {
  const images = document.body.querySelectorAll("img");

  for (const image of images) {
    try {
      const text = await summarizeChartFromDOM(image);
      console.log(text);

      if (text !== "N/A") {
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
    // Resolve relative path to absolute URL
    const imageUrl = new URL(imgElement.src, window.location.href).href;

    console.log(imageUrl);

    // Fetch image as blob
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Convert blob to base64
    const base64ImageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Strip off the data URI prefix
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    // Construct prompt
    const prompt = "You are a screen reader and came across this image. " +
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
                mimeType: imageBlob.type,
                data: base64ImageData,
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
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text || "N/A";
  } catch (err) {
    console.error("Summarization failed:", err);
    return "N/A";
  }
}

function ttsRead(text) {
  return new Promise((resolve) => {
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "en-US";
    currentUtterance.onend = resolve;
    synth.speak(currentUtterance);
  });
}