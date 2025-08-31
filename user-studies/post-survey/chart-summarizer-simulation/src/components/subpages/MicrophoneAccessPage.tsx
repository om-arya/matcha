import { useState } from "react";
import "../../styles/MicrophoneAccessPage.css";

function MicrophoneAccessPage() {
    const [micStatus, setMicStatus] = useState("");

    const requestMicrophoneAccess = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStatus("Microphone access granted. You are good to go!");
        } catch (err) {
            setMicStatus(
                "Microphone access denied. Please allow microphone permissions in your browser settings."
            );
        }
    };

    return (
        <div className="microphone-container" tabIndex={0}>
            <h1 className="microphone-title">Microphone Access Required</h1>

            <section className="microphone-section">
                <h2 className="microphone-heading">Enable Your Microphone</h2>
                <p>
                    To participate fully in this survey, you will need to enable your microphone. 
                    This is required to use the Q&amp;A feature that appears later in the survey.
                </p>

                <button 
                    className="microphone-button" 
                    onClick={requestMicrophoneAccess}
                >
                    Enable Microphone
                </button>
                {micStatus && <p className="microphone-status">{micStatus}</p>}

                <h3 className="microphone-subheading">Before continuing:</h3>
                <ul>
                    <p>• Please make sure your microphone is connected and accessible.</p>
                    <p>• If prompted by your browser, allow microphone permissions for this survey.</p>
                </ul>

                <h3 className="microphone-subheading">Test the Shortcut:</h3>
                <ul>
                    <p>• To ask a question later, you will use the command <strong>Alt+Shift+L</strong> (Windows) or <strong>Cmd+Shift+L</strong> (macOS).</p>
                    <p>• Please try pressing this command now to ensure it works with your setup.</p>
                </ul>

                <p>
                    <strong>Note:</strong> If the shortcut does not work, check your screen reader or browser settings before continuing.
                </p>
            </section>
        </div>
    );
}

export default MicrophoneAccessPage;