import { useEffect, useRef, useState } from 'react';
import './PromptComparer.css';

const PromptComparer = () => {
  const fileInputRef = useRef(null);
  const graphImageRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [outputs, setOutputs] = useState(['', '']);

  const basePrompt = {
    casual:
      'You are a screen reader. Summarize this graph in a casual tone: highlight the main trends or insights in 1-2 sentences.',
    detailed:
      'You are a screen reader and came across this image. If it is a data visualization (e.g. graph, chart, etc.): ' +
      'Give 1-2 sentences about the main features of the visualization including the title (if applicable), ' +
      'maximum(s), minimum(s), and general trend(s), as well as any key insight(s). ' +
      'Start it with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…" ' +
      'Otherwise: Simply output "N/A"',
  };

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

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const result = e.target.result;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectChange = async (index: number, mode: "casual" | "detailed") => {
    if (!imageUrl) {
      const newOutputs = [...outputs];
      newOutputs[index] = 'Please upload an image first.';
      setOutputs(newOutputs);
      return;
    }

    try {
      const responseText = await summarizeChartFromPrompt(imageUrl, basePrompt[mode]);
      const newOutputs = [...outputs];
      newOutputs[index] = responseText;
      setOutputs(newOutputs);
    } catch (err) {
      const newOutputs = [...outputs];
      newOutputs[index] = 'Failed to summarize.';
      setOutputs(newOutputs);
      console.error(err);
    }
  };

  const summarizeChartFromPrompt = async (imageUrl: string, customPrompt: string) => {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      const base64ImageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as String).split(',')[1]);
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
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ERR';
    } catch (err) {
      console.error('Summarization failed:', err);
      return 'ERR';
    }
  };

  return (
    <div>
      <h1>Upload a graph</h1>
      <input
        type="file"
        id="graph-input"
        name="graph-input"
        accept=".png, .jpg, .jpeg"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <img src={imageUrl || ''} id="graph-image" ref={graphImageRef} alt="Uploaded graph" />

      <div className="columns">
        {[0, 1].map((col) => (
          <div className={`column${col + 1}`} key={col}>
            <label htmlFor={`prompts-${col}`}>Choose a prompt:</label>
            <select
              name="prompts"
              id={`prompts-${col}`}
              defaultValue=""
              onChange={(e) => handleSelectChange(col, e.target.value as ("casual" | "detailed"))}
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="casual">Casual</option>
              <option value="detailed">Detailed</option>
            </select>
            <p id={`column${col + 1}-output`} className="output">
              {outputs[col]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptComparer;