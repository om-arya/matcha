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
        console.log(responseText);
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
  const params = new URLSearchParams({
    image_path: imageUrl,
    prompt: customPrompt
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