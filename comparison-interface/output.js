const GEMINI_API_KEY = await fetch(`http://127.0.0.1:8000/get_gemini_api_key`)
  .then(async (res) => {
    return JSON.parse(await res.text());
  })
  .catch((err) => {
    console.error("Retrieving Gemini API key failed:", err);
    return "ERR";
  });

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("graph-input");
  const graphImage = document.getElementById("graph-image");
  const selectElements = document.querySelectorAll("select[name='prompts']");
  const outputElements = document.querySelectorAll(".output");

  let uploadedImageURL = null;

  // When a file is selected
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImageURL = e.target.result;
      graphImage.setAttribute("src", uploadedImageURL);
    };
    reader.readAsDataURL(file);
  });

  // Handle each dropdown change
  selectElements.forEach((selectElement, index) => {
    selectElement.addEventListener("change", async (event) => {
      if (!uploadedImageURL) {
        outputElements[index].textContent = "Please upload an image first.";
        return;
      }

      const mode = event.target.value;
      const basePrompt = {
        casual:
          "You are a screen reader. Summarize this graph in a casual tone: highlight the main trends or insights in 1-2 sentences.",
        detailed:
          "You are a screen reader and came across this image. If it is a data visualization (e.g. graph, chart, etc.): " +
          "Give 1-2 sentences about the main features of the visualization including the title (if applicable), " +
          "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). " +
          "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" " +
          "Otherwise: Simply output \"N/A\"",
      };

      try {
        const responseText = await summarizeChartFromPrompt(uploadedImageURL, basePrompt[mode]);
        outputElements[index].textContent = responseText;
      } catch (err) {
        outputElements[index].textContent = "Failed to summarize.";
        console.error(err);
      }
    });
  });
});

/**
 * Adapted summarization function that accepts a custom prompt.
 */
async function summarizeChartFromPrompt(imageUrl, customPrompt) {
  try {
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
            { text: customPrompt },
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
    return data.candidates[0]?.content.parts[0]?.text || "ERR";
  } catch (err) {
    console.error("Summarization failed:", err);
    return "ERR";
  }
}