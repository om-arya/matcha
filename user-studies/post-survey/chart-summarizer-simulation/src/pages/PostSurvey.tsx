import {
    useEffect,
    useRef,
    useState
} from "react";
import * as firestore from "firebase/firestore";
import { db } from "../../firebaseConfig.ts";
import { postSurveyGraphData } from "../graph-data/postsurvey_graph_data.ts";
import { ttsRead } from "../services/questionService.ts";

import InformedConsentPage from "../components/subpages/InformedConsentPage.tsx";
import InstructionsPage from "../components/subpages/InstructionsPage.tsx";
import MicrophoneAccessPage from "../components/subpages/MicrophoneAccessPage.tsx";
import ConfirmationPage from "./ConfirmationPage.js";
import TitleHeader from "../components/headers/TitleHeader.tsx";
import SectionHeader from "../components/headers/SectionHeader.tsx";
import ProgressBar from "../components/ProgressBar.tsx";
import NavigationButtons from "../components/NavigationButtons.tsx";
import TextQuestion from "../components/questions/TextQuestion.tsx";
import MultipleChoiceQuestion from "../components/questions/MultipleChoiceQuestion.tsx";
import SelectMultipleQuestion from "../components/questions/SelectMultipleQuestion.tsx";
import GraphContainer from "../components/GraphContainer.tsx";
import Error from "../components/Error.tsx";

interface GraphData {
    filename: string;
    question: string;
    summary: string;
    summaryType: string;
}

interface PostSurveyData {
    initialScreener: string;
    informedConsentScreener: string;
    prolificID: string;
    BLVNDScreener: string;
    useScreenReadersScreener: string;
    currentScreenReaderScreener: string;

    age: string;
    raceAndEthnicity: string;
    highestLevelOfEducation: string;

    BLVNDSelection: string;
    screenReadersSelection: string;
    chartInterpretationConfidence: string;
    dataLiteracyTraining: string;

    findAndAnswer1: string;
    confidence1: string;
    informativeness1: string;
    usability1: string;

    findAndAnswer2: string;
    confidence2: string;
    informativeness2: string;
    usability2: string;

    findAndAnswer3: string;
    confidence3: string;
    informativeness3: string;
    usability3: string;

    findAndAnswer4: string;
    confidence4: string;
    informativeness4: string;
    usability4: string;

    wouldYouUse: string;
    chartSummarizerFeedback: string;
    qaFeedback: string;
}

function PostSurvey() {
    const title = "MATCHA Chart Summarizer: A Survey for Screen Reader Users";

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 11;

    const collectionID = "post-survey";
    const collectionRef = firestore.collection(db, collectionID);
    const answersRef = useRef<PostSurveyData>({
        initialScreener: "",
        informedConsentScreener: "",
        prolificID: "",
        BLVNDScreener: "",
        useScreenReadersScreener: "",
        currentScreenReaderScreener: "",
        age: "",
        raceAndEthnicity: "",
        highestLevelOfEducation: "",
        BLVNDSelection: "",
        screenReadersSelection: "",
        chartInterpretationConfidence: "",
        dataLiteracyTraining: "",
        findAndAnswer1: "",
        confidence1: "",
        informativeness1: "",
        usability1: "",
        findAndAnswer2: "",
        confidence2: "",
        informativeness2: "",
        usability2: "",
        findAndAnswer3: "",
        confidence3: "",
        informativeness3: "",
        usability3: "",
        findAndAnswer4: "",
        confidence4: "",
        informativeness4: "",
        usability4: "",
        wouldYouUse: "",
        chartSummarizerFeedback: "",
        qaFeedback: ""
    })
    
    const [graphs, setGraphs] = useState<GraphData[]>([]);
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const fetchGraphs = async () => {
        try {
            const counterRef = firestore.doc(db, "post-survey", "counter");
            const counterSnap = await firestore.getDoc(counterRef);

            if (counterSnap.exists()) {
                const data = counterSnap.data();
                setCounter(data?.value ?? 0);
            } else {
                setCounter(0);
                await firestore.setDoc(counterRef, { value: counter });
            }

            let selectedGraphs = [];

            const index = counter % 60;
            if (Math.floor((counter / 60)) % 2 === 0) {
                // Case 1: baseline for 1 and 2, optimized for 3 and 4
                selectedGraphs = postSurveyGraphData.slice(index, index + 4).map((row, idx) => ({
                    filename: row.filename,
                    question: row.question,
                    summary: idx < 2 ? row.baseline_summary : row.optimized_summary,
                    summaryType: idx < 2 ? "baseline" : "optimized"
                }));
            } else {
                // Case 2: baseline for 3 and 4, optimized for 1 and 2
                selectedGraphs = postSurveyGraphData.slice(index, index + 4).map((row, idx) => ({
                    filename: row.filename,
                    question: row.question,
                    summary: idx < 2 ? row.optimized_summary : row.baseline_summary,
                    summaryType: idx < 2 ? "optimized" : "baseline"
                }));
            }

            setGraphs(selectedGraphs);

            await firestore.updateDoc(counterRef, { value: counter + 4 });
        } catch (err) {
            console.error("Error fetching graphs:", err);
        }
        };

        fetchGraphs();
    }, []);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field: keyof PostSurveyData, value: string) => {
        answersRef.current = {
            ...answersRef.current,
            [field]: value,
        };
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        // Before the chart simulation, let the user know the command works.
        if (currentPage < 7) {
            if ((event.key === "l" && event.altKey) || (event.key === "l" && event.metaKey && event.shiftKey)) {
                event.preventDefault();
                ttsRead("You pressed the command to ask a question about a graph! This command will be useful in a later section of the survey, and we'll let you know when to use it.");
            }
        }
    };

    window.addEventListener("keydown", handleKeyDown);

    const validateCurrentPage = async (): Promise<boolean> => {
        let requiredFields: (keyof PostSurveyData)[] = [];

        if (currentPage === 1) {
            const urlParams = new URLSearchParams(window.location.search);
            const prolificID = urlParams.get("PROLIFIC_PID");
            if (!!prolificID) {
                handleChange("prolificID", prolificID);
                return true;
            } else {
                setError("We could not determine your Prolific ID. Please retry the survey link on Prolific.");
                return false;
            }
        }

        if (currentPage === 3) {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                return true;
            } catch (err) {
                setError("You must enable your microphone to continue.");
                return false;
            }
        }

        switch (currentPage) {
            case 4:
                requiredFields = ["initialScreener", "informedConsentScreener", "prolificID", "BLVNDScreener"];
                break;
            case 5:
                requiredFields = ["useScreenReadersScreener", "currentScreenReaderScreener"];
                break;
            case 6:
                requiredFields = [
                    "age",
                    "raceAndEthnicity",
                    "highestLevelOfEducation",
                    "BLVNDSelection",
                    "screenReadersSelection",
                    "chartInterpretationConfidence",
                    "dataLiteracyTraining"
                ];
                break;
            case 7:
                requiredFields = ["findAndAnswer1", "confidence1", "informativeness1", "usability1"];
                break;
            case 8:
                requiredFields = ["findAndAnswer2", "confidence2", "informativeness2", "usability2"];
                break;
            case 9:
                requiredFields = ["findAndAnswer3", "confidence3", "informativeness3", "usability3"];
                break;
            case 10:
                requiredFields = ["findAndAnswer4", "confidence4", "informativeness4", "usability4"];
                break;
            case 11:
                requiredFields = ["wouldYouUse", "chartSummarizerFeedback", "qaFeedback"];
                break;
            default:
                return true; // Pages like instructions and consent don’t require validation
        }

        for (const field of requiredFields) {
            if (!answersRef.current[field] || answersRef.current[field].trim() === "") {
                setError("Please complete all required fields on this page before proceeding.");
                return false;
            }

            const answer = answersRef.current[field].trim();

            if (field === "initialScreener" && !(answer.toLowerCase().startsWith("yes"))) {
                setError("You must type \"Yes\" for the first question on this page.")
                return false;
            }

            if (field === "informedConsentScreener" && !(answer.toLowerCase().startsWith("i agree"))) {
                setError("You must type \"I agree\" for the second question on this page.")
                return false;
            }

            if ((field === "BLVNDScreener" || field === "useScreenReadersScreener" || field === "currentScreenReaderScreener") && answer === "No") {
                handleFormSubmission();
            }
        }

        setError("");
        return true;
    };

    const validateForm = () => {
        for (const [_, value] of Object.entries(answersRef.current)) {
            if (value === '') {
                setError("Cannot submit: You have not completed one or more sections in the form");
                return false;
            }
        }
        return true;
    }

    const handleFormSubmission = async () => {
        const submissionObj: Record<string, string> = {};

        submissionObj["participantNumber"] = (counter / 4).toString();
        submissionObj["submissionTimestamp"] = new Date().toISOString();
        Object.keys(answersRef.current).forEach((field) => {
            submissionObj[field] = answersRef.current[field as keyof PostSurveyData];
        });
        graphs.map((graph, i) => {
            submissionObj[`graphFilename${i}`] = graph.filename;
            submissionObj[`graphSummaryType${i}`] = graph.summaryType;
        })

        try {
            await firestore.addDoc(collectionRef, submissionObj);
            setIsSubmitted(true);
        } catch (error) {
            setError("Server error. Please try again later.");
        }
    }

    const handleSubmitClick = async () => {
        if (!(validateForm())) {
            return;
        };

        handleFormSubmission();
    };

    // Navigate to confirmation page
    if (isSubmitted) {
        return <ConfirmationPage formName={title} />;
    }

    const progressBar = 
        <ProgressBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageLabels={[
                "Instructions",
                "Informed Consent",
                "Microphone Access",
                "Initial Questions",
                "Screen Readers",
                "Demographics",
                "Chart Summarizer Simulation (Page 1)",
                "Chart Summarizer Simulation (Page 2)",
                "Chart Summarizer Simulation (Page 3)",
                "Chart Summarizer Simulation (Page 4)",
                "Final Feedback"
            ]}
        />
    
    return (
        <>
            <TitleHeader title={title} />

            {(currentPage === 1) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Instructions" />

                    <InstructionsPage />
                </>
            ) : (currentPage === 2) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Informed Consent" />

                    <InformedConsentPage />
                </>
            ) : (currentPage === 3) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Microphone Access" />

                    <MicrophoneAccessPage />
                </>
            ) : (currentPage === 4) ? (
                <>
                   {progressBar}

                   <SectionHeader label="Initial Questions" />
                   <TextQuestion
                        label={"Please answer all questions independently and to the best of your ability. Since you were identified as a screen reader user on Prolific, you must use your screen reader to take this survey. If do not use your screen reader for the following questions, your submission will be disqualified.\n\n\n\nThe use of artificial intelligence tools or copying and pasting from external sources is strictly prohibited. Any indication of such use will result in the immediate return of your submission and will disqualify your participation. Type \"Yes\" if you understand."}
                        controlledValue={answersRef.current.initialScreener}
                        onChange={(value) => handleChange("initialScreener", value)}
                   />

                   <TextQuestion
                        label={"To proceed with the survey, type \"I agree\" in the box below. This confirms you have read the consent form from the previous page and agree to participate in this research study."}
                        controlledValue={answersRef.current.informedConsentScreener}
                        onChange={(value) => handleChange("informedConsentScreener", value)}
                   />

                   <MultipleChoiceQuestion
                        key="BLVNDScreener"
                        label="Do you identify as blind, low-vision, or neurodivergent?"
                        options={[
                            "Yes",
                            "No"
                        ]}
                        controlledValue={answersRef.current.BLVNDScreener}
                        onChange={(value) => handleChange("BLVNDScreener", value)}
                    />
                </>
            ) : (currentPage === 5) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Screen Readers (Part 1)" />

                    <MultipleChoiceQuestion
                        label="Do you use screen readers? (for example, NVDA, JAWS)"
                        options={[
                            "Yes",
                            "No"
                        ]}
                        controlledValue={answersRef.current.useScreenReadersScreener}
                        onChange={(value) => handleChange("useScreenReadersScreener", value)}
                    />

                    <SectionHeader label="Screen Readers (Part 2)" />

                    <MultipleChoiceQuestion
                        key="currentScreenReaderScreener"
                        label="Are you currently using your screen reader while taking this survey?"
                        options={[
                            "Yes",
                            "No"
                        ]}
                        controlledValue={answersRef.current.currentScreenReaderScreener}
                        onChange={(value) => handleChange("currentScreenReaderScreener", value)}
                    />
                </>
            ) : (currentPage === 6) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Demographics (Part 1)" />

                    <MultipleChoiceQuestion
                        label="What is your age?"
                        options={[
                            "18 to 24",
                            "25 to 34",
                            "35 to 44",
                            "45 to 54",
                            "55 to 64",
                            "65 or older",
                            "Prefer not to say"
                        ]}
                        controlledValue={answersRef.current.age}
                        onChange={(value) => handleChange("age", value)}
                    />

                    <SelectMultipleQuestion
                        label="What is your self-identified race and ethnicity?"
                        options={[
                            "American Indian or Alaska Native",
                            "Asian",
                            "Black or African American",
                            "Hispanic or Latino/a/x",
                            "Middle Eastern or North African",
                            "Native Hawaiian or Other Pacific Islander",
                            "White",
                            "Prefer not to say",
                            "Other"
                        ]}
                        controlledValue={answersRef.current.raceAndEthnicity}
                        onChange={(value) => handleChange("raceAndEthnicity", value)}
                    />

                    <MultipleChoiceQuestion
                        label="What is your highest level of education?"
                        options={[
                            "Less than high school diploma",
                            "High school diploma/G.E.D.",
                            "Some college, no degree",
                            "Associate degree (for example, AA, AS)",
                            "Bachelor's degree (for example, BA, BS)",
                            "Master's degree (for example, MA, MS, MBA)",
                            "Professional degree (for example, MD, JD, PharmD)",
                            "Doctoral degree (for example, PhD, EdD)",
                            "Prefer not to say"
                        ]}
                        controlledValue={answersRef.current.highestLevelOfEducation}
                        onChange={(value) => handleChange("highestLevelOfEducation", value)}
                    />

                    <SectionHeader label="Demographics (Part 2)" />

                    <SelectMultipleQuestion
                        label="Which of the following blind, low-vision, or neurodivergent conditions apply to you? (Select all that apply)"
                        options={[
                            "Blind",
                            "Low-vision",
                            "ADHD (Attention-Deficit/Hyperactivity Disorder)",
                            "ASD (Autism Spectrum Disorder)",
                            "SLD (Specific Learning Disorder - dyslexia, dyscalculia, dysgraphia, and/or dyspraxia)",
                            "SPD (Sensory Processing Disorder)",
                            "Other"
                        ]}
                        controlledValue={answersRef.current.BLVNDSelection}
                        onChange={(value) => handleChange("BLVNDSelection", value)}
                    />

                    <SelectMultipleQuestion
                        label="Which screen readers do you use? (Select all that apply)"
                        options={[
                            "NVDA",
                            "JAWS",
                            "VoiceOver (macOS/iOS)",
                            "TalkBack (Android)",
                            "Narrator (Windows)",
                            "Dolphin ScreenReader",
                            "I do not use screen readers.",
                            "Other"
                        ]}
                        controlledValue={answersRef.current.screenReadersSelection}
                        onChange={(value) => handleChange("screenReadersSelection", value)}
                    />

                    <MultipleChoiceQuestion
                        label="How confident are you (on a 4-point scale: Not at all to Extremely) in interpreting data from charts?"
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.chartInterpretationConfidence}
                        onChange={(value) => handleChange("chartInterpretationConfidence", value)}
                    />

                    <TextQuestion
                        label="Do you have any formal training in data literacy (for example, coursework, workshops)? If so, describe it briefly."
                        controlledValue={answersRef.current.dataLiteracyTraining}
                        onChange={(value) => handleChange("dataLiteracyTraining", value)}
                   />
                </>
            ) : (currentPage === 7) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Chart Summarizer Simulation (Part 1)" />

                    <GraphContainer
                        filename={graphs[0].filename}
                        summary={graphs[0].summary}
                    />

                    <TextQuestion
                        key="findAndAnswer1"
                        label={graphs[0].question}
                        controlledValue={answersRef.current.findAndAnswer1}
                        onChange={(value) => handleChange("findAndAnswer1", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence1"
                        label={"To what extent do you agree with the following statement?: \"I am confident my answer was correct.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.confidence1}
                        onChange={(value) => handleChange("confidence1", value)}
                    />

                    <MultipleChoiceQuestion
                        key="informativeness1"
                        label={"To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness1}
                        onChange={(value) => handleChange("informativeness1", value)}
                    />

                    <MultipleChoiceQuestion
                        key="usability1"
                        label={"To what extent do you agree with the following statement?: \"It was easy to understand the summary.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.usability1}
                        onChange={(value) => handleChange("usability1", value)}
                    />
                </>
            ) : (currentPage === 8) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Chart Summarizer Simulation (Part 2)" />

                    <GraphContainer
                        filename={graphs[1].filename}
                        summary={graphs[1].summary}
                    />

                    <TextQuestion
                        key="findAndAnswer2"
                        label={graphs[1].question}
                        controlledValue={answersRef.current.findAndAnswer2}
                        onChange={(value) => handleChange("findAndAnswer2", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence2"
                        label={"To what extent do you agree with the following statement?: \"I am confident my answer was correct.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.confidence2}
                        onChange={(value) => handleChange("confidence2", value)}
                    />

                    <MultipleChoiceQuestion
                        key="informativeness2"
                        label={"To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness2}
                        onChange={(value) => handleChange("informativeness2", value)}
                    />

                    <MultipleChoiceQuestion
                        key="usability2"
                        label={"To what extent do you agree with the following statement?: \"It was easy to understand the summary.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.usability2}
                        onChange={(value) => handleChange("usability2", value)}
                    />
                </>
            ) : (currentPage === 9) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Chart Summarizer Simulation (Part 3)" />

                    <GraphContainer
                        filename={graphs[2].filename}
                        summary={graphs[2].summary}
                    />

                    <TextQuestion
                        key="findAndAnswer3"
                        label={graphs[2].question}
                        controlledValue={answersRef.current.findAndAnswer3}
                        onChange={(value) => handleChange("findAndAnswer3", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence3"
                        label={"To what extent do you agree with the following statement?: \"I am confident my answer was correct.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.confidence3}
                        onChange={(value) => handleChange("confidence3", value)}
                    />

                    <MultipleChoiceQuestion
                        key="informativeness3"
                        label={"To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness3}
                        onChange={(value) => handleChange("informativeness3", value)}
                    />

                    <MultipleChoiceQuestion
                        key="usability3"
                        label={"To what extent do you agree with the following statement?: \"It was easy to understand the summary.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.usability3}
                        onChange={(value) => handleChange("usability3", value)}
                    />
                </>
            ) : (currentPage === 10) ? (
                <>
                    {progressBar}

                    <SectionHeader label="Chart Summarizer Simulation (Part 4)" />

                    <GraphContainer
                        filename={graphs[3].filename}
                        summary={graphs[3].summary}
                    />

                    <TextQuestion
                        key="findAndAnswer4"
                        label={graphs[3].question}
                        controlledValue={answersRef.current.findAndAnswer4}
                        onChange={(value) => handleChange("findAndAnswer4", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence4"
                        label={"To what extent do you agree with the following statement?: \"I am confident my answer was correct.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.confidence4}
                        onChange={(value) => handleChange("confidence4", value)}
                    />

                    <MultipleChoiceQuestion
                        key="informativeness4"
                        label={"To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness4}
                        onChange={(value) => handleChange("informativeness4", value)}
                    />

                    <MultipleChoiceQuestion
                        key="usability4"
                        label={"To what extent do you agree with the following statement?: \"It was easy to understand the summary.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.usability4}
                        onChange={(value) => handleChange("usability4", value)}
                    />
                </>
            ) : (
                <>
                    {progressBar}

                    <SectionHeader label="Final Feedback" />

                    <MultipleChoiceQuestion
                        label={"Based on your interaction with the chart summarizer, would you incorporate this tool into your life?"}
                        options={[
                            "Yes",
                            "No",
                            "Maybe"
                        ]}
                        controlledValue={answersRef.current.wouldYouUse}
                        onChange={(value) => handleChange("wouldYouUse", value)}
                    />

                    <TextQuestion
                        label={"Please provide feedback on your overall experience with the chart summarizer. Answer in at least 2-3 sentences."}
                        controlledValue={answersRef.current.chartSummarizerFeedback}
                        onChange={(value) => handleChange("chartSummarizerFeedback", value)}
                    />

                    <TextQuestion
                        label={"Please provide feedback on your experience with the Q&A feature. Answer in at least 2-3 sentences."}
                        controlledValue={answersRef.current.qaFeedback}
                        onChange={(value) => handleChange("qaFeedback", value)}
                    />
                </>
            )}

            <NavigationButtons
                onNext={async () => {
                    const isValidPage = await validateCurrentPage();
                    if (!isValidPage) return; // stop if validation fails

                    if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                    } else {
                        handleSubmitClick();
                    }
                }}
                onBack={() => {
                    setError("");
                    if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }
                }}
                canGoBack={currentPage > 1}
                nextLabel={currentPage === totalPages ? 'Submit' : 'Next'}
            />

            <Error message={error} />
        </>
    );
}

export default PostSurvey;