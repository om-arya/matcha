import "../../styles/InstructionsPage.css";

function InstructionsPage() {
    return (
        <div className="instructions-container" tabIndex={0}>
            <h1 className="instructions-title">MATCHA Chart Summarizer Survey</h1>

            <section className="instructions-section">
                <h2 className="instructions-heading">Instructions</h2>
                <p>
                    Welcome to the MATCHA Chart Summarizer Survey. This survey is designed for screen reader users to evaluate how effectively chart summaries communicate key information.
                </p>

                <h3 className="instructions-subheading">Before you begin:</h3>
                <ul>
                    <p>• Only participants who use a screen reader and have a working speaker and microphone should continue.</p>
                    <p>• Complete all sections independently. Do not use external tools, AI assistants, or copy answers. Submissions that do will be disqualified.</p>
                    <p>• Navigate using your screen reader. Use the "Next" and "Back" buttons to move between pages.</p>
                </ul>

                <h3 className="instructions-subheading">What to expect:</h3>
                <ul>
                    <p>• You will first answer questions about your background and experience.</p>
                    <p>• Then, you will interact with several charts and accompanying summaries. For each chart, you will answer questions and rate your confidence, the summary's informativeness, and its usability. The charts will be blurred to ensure your full understanding of it comes from the summary alone.</p>
                    <p>• You will also have the ability to ask questions about these charts, using the Alt+L command (or Cmd+Shift+L on macOS). Please try pressing this command now.</p>
                    <p>• Finally, you will provide your overall feedback on the chart summarizer.</p>
                </ul>

                <p><strong>Time commitment:</strong> Approximately 25-30 minutes.</p>
            </section>
        </div>
    );
}

export default InstructionsPage;