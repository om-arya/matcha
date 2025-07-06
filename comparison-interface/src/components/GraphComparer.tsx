import { useEffect, useState } from 'react';
import '../styles/Comparer.css';

const GraphComparer = () => {
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [outputs, setOutputs] = useState(['', '']);
  const [similarity, setSimilarity] = useState(0);

  // A single prompt that will be applied to both images
  const basePrompt =
    'You are a screen reader and came across this image. If it is a data visualization (e.g. graph, chart, etc.): ' +
    'Give 1-2 sentences about the main features of the visualization including the title (if applicable), ' +
    'maximum(s), minimum(s), and general trend(s), as well as any key insight(s). ' +
    'Start it with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…" ' +
    'Otherwise: Simply output "N/A"';

  // Fetch Gemini API key once on mount
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

  // Handle when the user uploads a file
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

  // Button click – generate summaries for each image separately
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

    const sentence1 = newOutputs[0];
    const sentence2 = newOutputs[1];

    const params = new URLSearchParams({ sentence1, sentence2 });
    const BASE_URL = "http://127.0.0.1:8002/compute_semantic_similarity";

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const similarityScore = await response.json();
    setSimilarity(similarityScore);

    setOutputs(newOutputs);
  };

  // Summarize a single chart
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

  return (
    <div>
      <h1>Compare Two Graphs</h1>

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
              src={imageUrls[i] || undefined}
              id={`graph-image-${i}`}
              alt={`Graph ${i + 1}`}
            />
            <p id={`column${i + 1}-output`} className="output">
              {outputs[i]}
            </p>
          </div>
        ))}
      </div>

      <p>Semantic similarity score: {similarity === 0 ? "N/A" : similarity}</p>

      <button onClick={handleGenerateSummaries}>Generate Summaries</button>
    </div>
  );
};

export default GraphComparer;