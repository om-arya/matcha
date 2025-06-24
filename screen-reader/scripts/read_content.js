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
    const imageUrl = new URL(imgElement.src, window.location.href).href;

    const prompt = (
        "You are a screen reader and came across this image. " +
        "If it is a data visualization (e.g. graph, chart, etc.): " +
        "Give 1-2 sentences about the main features of the visualization including the title (if applicable), " +
        "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). " +
        "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" " +
        "Otherwise: Simply output \"N/A\""
    );

    const params = new URLSearchParams({
      image_path: imageUrl,
      prompt
    });

    const url = `http://127.0.0.1:8000/get_summary?${params.toString()}`;

    return await fetch(url)
      .then (async (res) => {
        const summary = JSON.parse(await res.text());
        return summary;
      })
      .catch((err) => {
        console.error("Retrieving summarization failed:", err);
        return "ERR";
      })
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