import { useEffect, useState } from 'react';
import './GraphComparer.css';

/**
 * GraphComparer
 * Allows users to upload two graphs and generates **two separate summaries**—one for each graph—
 * using the **same prompt**. Class names/IDs remain unchanged so existing CSS continues to work.
 */
const GraphComparer = () => {
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [outputs, setOutputs] = useState(['', '']);

  // A single prompt that will be applied to both images
  const basePrompt =
    'You are a screen reader and came across this image. If it is a data visualization (e.g. graph, chart, etc.): ' +
    'Give 1-2 sentences about the main features of the visualization including the title (if applicable), ' +
    'maximum(s), minimum(s), and general trend(s), as well as any key insight(s). ' +
    'Start it with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…" ' +
    'Otherwise: Simply output "N/A"';

  /* ------------------------------------------------------------------ */
  /*  Fetch Gemini API key once on mount                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/get_gemini_api_key');
        const data = await res.json();
        setGeminiApiKey(data);
      } catch (err) {
        console.error('Retrieving Gemini API key failed:', err);
        setGeminiApiKey('ERR');
      }
    };

    fetchApiKey();
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Handle file uploads                                               */
  /* ------------------------------------------------------------------ */
  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...imageUrls];
      updated[index] = e.target?.result as string;
      setImageUrls(updated);
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------------------------------------------ */
  /*  Button click – generate summaries for each image separately       */
  /* ------------------------------------------------------------------ */
  const handleGenerateSummaries = async () => {
    const newOutputs = [...outputs];

    await Promise.all(
      imageUrls.map(async (url, idx) => {
        if (!url) {
          newOutputs[idx] = 'Please upload an image first.';
          return;
        }

        try {
          newOutputs[idx] = await summarizeChart(url, basePrompt);
        } catch (err) {
          console.error(`Summarization failed for graph ${idx + 1}:`, err);
          newOutputs[idx] = 'Failed to summarize.';
        }
      })
    );

    setOutputs(newOutputs);
  };

  /* ------------------------------------------------------------------ */
  /*  Summarize a single chart                                          */
  /* ------------------------------------------------------------------ */
  const summarizeChart = async (imageUrl: string, customPrompt: string) => {
    try {
      // Fetch the image and convert to base64 (strip the prefix)
      const imgRes = await fetch(imageUrl);
      const imgBlob = await imgRes.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imgBlob);
      });

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: imgBlob.type,
                  data: base64,
                },
              },
              { text: customPrompt },
            ],
          },
        ],
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ERR';
    } catch (err) {
      console.error('Summarization failed:', err);
      return 'ERR';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  JSX                                                                */
  /* ------------------------------------------------------------------ */
  return (
    <div>
      <h1>Compare Two Graphs</h1>

      {/* Upload Inputs + Previews */}
      <div className="columns">
        {[0, 1].map((i) => (
          <div className={`column${i + 1}`} key={i}>
            <label htmlFor={`graph-input-${i}`}>Upload Graph {i + 1}:</label>
            <input
              type="file"
              id={`graph-input-${i}`}
              name={`graph-input-${i}`}
              accept=".png, .jpg, .jpeg"
              onChange={(e) => handleFileChange(i, e)}
            />
            <img
              src={imageUrls[i] || ''}
              id={`graph-image-${i}`}
              alt={`Graph ${i + 1}`}
            />
            <p id={`column${i + 1}-output`} className="output">
              {outputs[i]}
            </p>
          </div>
        ))}
      </div>

      <button onClick={handleGenerateSummaries}>Generate Summaries</button>
    </div>
  );
};

export default GraphComparer;