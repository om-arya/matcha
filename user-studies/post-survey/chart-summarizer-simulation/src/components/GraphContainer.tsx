import { useEffect } from "react";
import styles from "../css-modules/GraphContainer.module.css";
import { handleAskQuestion } from "../services/questionService.ts";

interface GraphContainerProps {
    filename: string;
    summary: string;
}

function GraphContainer({ filename, summary }: GraphContainerProps) {
    const imageFilepath = `/graphs/${filename}`;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.key === "l" && event.altKey) || (event.key === "l" && event.metaKey && event.shiftKey)) {
                event.preventDefault();
                handleAskQuestion(imageFilepath);
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

            <p className={styles.tip} tabIndex={0}>
                Press Alt+L (or Cmd+Shift+L on macOS) to ask a question about this graph.
            </p>
        </div>
    );
}

export default GraphContainer;