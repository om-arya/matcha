const synth = window.speechSynthesis;
let currentUtterance = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

readContent();

async function readContent() {
  const images = document.body.querySelectorAll("img");

  for (const image of images) {
    try {
      const summary = await summarizeChartFromDOM(image);

      if (summary !== "N/A" && summary !== "ERR") {
        await ttsRead(summary);
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

    const params = new URLSearchParams({
      imageUrl
    });

    const url = `http://127.0.0.1:8000/get_summary?${params.toString()}`;

    const summary = await fetch(url, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return summary;
  } catch (err) {
    console.error("Retrieving summarization failed:", err);
    return "ERR";
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