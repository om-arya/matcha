import { useEffect } from "react";
import styles from "../css-modules/GraphContainer.module.css";
import { handleAskQuestion, ttsRead } from "../services/questionService.ts";

interface GraphContainerProps {
    filename: string;
    summary: string;
    summaryType: string;
}

function GraphContainer({ filename, summary, summaryType }: GraphContainerProps) {
    const imageFilepath = `/graphs/${filename}`;

        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if ((event.key === "L" && event.altKey && event.shiftKey) || (event.key === "l" && event.metaKey && event.shiftKey)) {
                    event.preventDefault();
                    if (summaryType === "optimized") {
                        handleAskQuestion(imageFilepath);
                    } else {
                        ttsRead("The Q&A feature is unavailable for this graph.")
                    }
                }
            };

            window.addEventListener("keydown", handleKeyDown);

            return () => {
                window.removeEventListener("keydown", handleKeyDown);
            };
        }, [filename]);

    return (
        <div className={styles.graphContainer}>
            <img src={imageFilepath} alt={filename} className={styles.graph} tabIndex={0}/>

            <p className={styles.summary} tabIndex={0}>
                {summary}
            </p>

            {summaryType === "optimized" ?
                <p className={styles.tip} tabIndex={0}>
                    The Q&A feature is enabled for this graph. Press Alt+Shift+L (or Cmd+Shift+L on macOS) to ask a question.
                </p> :
                <p className={styles.tip} tabIndex={0}>
                    The Q&A feature is unavailable for this graph.
                </p>}
        </div>
    );
}

export default GraphContainer;