declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";
let GEMINI_API_KEY: string | undefined = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

function ttsRead(text: string) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    window.speechSynthesis.speak(speech);
}

async function urlToFile(url: string): Promise<File> {
    const res = await fetch(url);
    const blob = await res.blob();
    const filename = url.split("/").pop() || "image";
    return new File([blob], filename, { type: blob.type });
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const matches = result.match(/^data:(.*);base64,(.*)$/);
            if (!matches || matches.length !== 3) {
                reject("Invalid file result");
                return;
            }
            const mimeType = matches[1];
            const base64 = matches[2];
            resolve({ base64, mimeType });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

async function geminiGenerateContent(base64: string, mimeType: string, prompt: string) {
  try {
    const res = await fetch(`${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.error) {
      console.error("Gemini API error:", data.error);
      return null;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Gemini request failed:", err);
    return null;
  }
}

async function handleAskQuestion(imageFilepath: string) {
    ttsRead("I'm listening. Please ask your question.");

    const imageFile = await urlToFile(imageFilepath);

    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionClass) {
        ttsRead("Sorry, your browser does not support speech recognition.");
        return;
    }

    const spokenQuestion: any = await new Promise((resolve, reject) => {
        const recognition = new RecognitionClass();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            const question = event.results[0][0].transcript;
            resolve(question);
        };

        recognition.onerror = (event: any) => {
            reject(`Speech recognition error: ${event.error}`);
        };

        recognition.start();
    }).catch(err => {
        console.error(err);
        ttsRead("Sorry, I could not hear your question. Please try again.");
        throw err;
    });

    const prompt = `You are a screen reader looking at a data visualization image and were asked the following question: "${spokenQuestion}". ` +
                   "Answer the question in a paragraph or shorter, using the content of the chart image. " +
                   "You have already provided a summary of the chart image, so no need to do it again. You also do not need to repeat the question. Just answer the question." +
                   "If the chart is unclear or the question is not answerable from the chart, say so.";

    const { base64, mimeType } = await fileToBase64(imageFile);

    const response = await geminiGenerateContent(base64, mimeType, prompt);
    const answer = response || "I'm sorry, I couldn't answer that.";
    ttsRead(answer);
}

export {
    handleAskQuestion
}