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

    qaInformativeness1: string;
    spokenQuestions1: string;

    qaInformativeness2: string;
    spokenQuestions2: string;

    chartSummarizerRating: string;
    qaRating: string;
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
        qaInformativeness1: "",
        spokenQuestions1: "",
        qaInformativeness2: "",
        spokenQuestions2: "",
        chartSummarizerRating: "",
        qaRating: "",
        wouldYouUse: "",
        chartSummarizerFeedback: "",
        qaFeedback: ""
    })
    
    const [graphs, setGraphs] = useState<GraphData[]>([]);
    const [summaryOrderType, setSummaryOrderType] = useState<1 | 2>(1);
    let counter: number;

    useEffect(() => {
        const fetchGraphs = async () => {
        try {
            const counterRef = firestore.doc(db, "post-survey", "counter");
            const counterSnap = await firestore.getDoc(counterRef);

            if (counterSnap.exists()) {
                const data = counterSnap.data();
                counter = data.value;
                await firestore.updateDoc(counterRef, { value: firestore.increment(4) });
            } else {
                counter = 0;
                await firestore.setDoc(counterRef, { value: 4 });
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
                setSummaryOrderType(1);
            } else {
                // Case 2: baseline for 3 and 4, optimized for 1 and 2
                selectedGraphs = postSurveyGraphData.slice(index, index + 4).map((row, idx) => ({
                    filename: row.filename,
                    question: row.question,
                    summary: idx < 2 ? row.optimized_summary : row.baseline_summary,
                    summaryType: idx < 2 ? "optimized" : "baseline"
                }));
                setSummaryOrderType(2);
            }

            setGraphs(selectedGraphs);
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

    const [spokenQuestions1, setSpokenQuestions1] = useState<string[]>([]);
    const [spokenQuestions2, setSpokenQuestions2] = useState<string[]>([]);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (currentPage < 7) {
            // Before the chart simulation, let the user know the command works.
            if ((event.key === "L" && event.altKey && event.shiftKey) || (event.key === "l" && event.metaKey && event.shiftKey)) {
                event.preventDefault();
                ttsRead("You pressed the command to ask a question about a graph! This command will be useful in a later section of the survey, and we'll let you know when to use it.");
            }
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const validateCurrentPage = async (): Promise<boolean> => {
        let questions: {index: number, field: (keyof PostSurveyData)}[] = [];

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
                questions = [
                    {index: 1, field: "initialScreener"},
                    {index: 2, field: "informedConsentScreener"},
                    {index: 3, field: "BLVNDScreener"}
                ];
                break;
            case 5:
                questions = [
                    {index: 4, field: "useScreenReadersScreener"},
                    {index: 5, field: "currentScreenReaderScreener"}
                ];
                break;
            case 6:
                questions = [
                    {index: 6, field: "age"},
                    {index: 7, field: "raceAndEthnicity"},
                    {index: 8, field: "highestLevelOfEducation"},
                    {index: 9, field: "BLVNDSelection"},
                    {index: 10, field: "screenReadersSelection"},
                    {index: 11, field: "chartInterpretationConfidence"},
                    {index: 12, field: "dataLiteracyTraining"}
                ];
                break;
            case 7:
                if (summaryOrderType === 1) {
                    questions = [
                        {index: 13, field: "findAndAnswer1"},
                        {index: 14, field: "confidence1"},
                        {index: 15, field: "informativeness1"},
                        {index: 16, field: "usability1"},
                        {index: 17, field: "qaInformativeness1"}
                    ];
                } else {
                    questions = [
                        {index: 13, field: "findAndAnswer1"},
                        {index: 14, field: "confidence1"},
                        {index: 15, field: "informativeness1"},
                        {index: 16, field: "usability1"}
                    ];
                }
                break;
            case 8:
                if (summaryOrderType === 1) {
                    questions = [
                        {index: 18, field: "findAndAnswer2"},
                        {index: 19, field: "confidence2"},
                        {index: 20, field: "informativeness2"},
                        {index: 21, field: "usability2"},
                        {index: 22, field: "qaInformativeness2"}
                    ];
                } else {
                    questions = [
                        {index: 17, field: "findAndAnswer2"},
                        {index: 18, field: "confidence2"},
                        {index: 19, field: "informativeness2"},
                        {index: 20, field: "usability2"}
                    ];
                }
                break;
            case 9:
                if (summaryOrderType === 1) {
                    questions = [
                        {index: 23, field: "findAndAnswer3"},
                        {index: 24, field: "confidence3"},
                        {index: 25, field: "informativeness3"},
                        {index: 26, field: "usability3"}
                    ];
                } else {
                    questions = [
                        {index: 21, field: "findAndAnswer3"},
                        {index: 22, field: "confidence3"},
                        {index: 23, field: "informativeness3"},
                        {index: 24, field: "usability3"},
                        {index: 25, field: "qaInformativeness1"}
                    ];
                }
                break;
            case 10:
                if (summaryOrderType === 1) {
                    questions = [
                        {index: 27, field: "findAndAnswer4"},
                        {index: 28, field: "confidence4"},
                        {index: 29, field: "informativeness4"},
                        {index: 30, field: "usability4"}
                    ];
                } else {
                    questions = [
                        {index: 26, field: "findAndAnswer4"},
                        {index: 27, field: "confidence4"},
                        {index: 28, field: "informativeness4"},
                        {index: 29, field: "usability4"},
                        {index: 30, field: "qaInformativeness2"}
                    ];
                }
                break;
            case 11:
                questions = [
                    {index: 31, field: "chartSummarizerRating"},
                    {index: 32, field: "qaRating"},
                    {index: 33, field: "wouldYouUse"},
                    {index: 34, field: "chartSummarizerFeedback"},
                    {index: 35, field: "qaFeedback"}
                ];
                break;
            default:
                return true; // Pages like instructions and consent don’t require validation
        }

        let unansweredQuestions = [];
        for (const question of questions) {
            if (!answersRef.current[question.field] || answersRef.current[question.field].trim() === "") {
                unansweredQuestions.push(question);
            }

            const answer = answersRef.current[question.field].trim();

            if (question.field === "initialScreener" && !(answer.toLowerCase().startsWith("yes"))) {
                setError("You must type \"Yes\" for the first question on this page.")
                return false;
            }

            if (question.field === "informedConsentScreener" && !(answer.toLowerCase().startsWith("i agree"))) {
                setError("You must type \"I agree\" for the second question on this page.")
                return false;
            }

            if ((question.field === "BLVNDScreener" || question.field === "useScreenReadersScreener" || question.field === "currentScreenReaderScreener") && answer === "No") {
                handleFormSubmission();
            }
        }

        if (unansweredQuestions.length > 1) {
            const indices = unansweredQuestions.map(q => q.index);
            const indicesString =
                indices.length === 2
                    ? indices.join(" and ")
                    : indices.slice(0, -1).join(", ") + " and " + indices[indices.length - 1];

            setError(`You have not answered questions ${indicesString}. You must answer all questions on this page before proceeding.`);
            return false;
        } else if (unansweredQuestions.length === 1) {
            setError(`You have not answered question ${unansweredQuestions[0].index}. You must answer all questions on this page before proceeding.`)
            return false;
        }

        setError("");
        return true;
    };

    const handleFormSubmission = async () => {
        const submissionObj: Record<string, string> = {};

        let counter;
        const counterRef = firestore.doc(db, "post-survey", "counter");
        const counterSnap = await firestore.getDoc(counterRef);
        const data = counterSnap.data();
        counter = data!.value;

        submissionObj["participantNumber"] = (counter / 4).toString();
        submissionObj["submissionTimestamp"] = new Date().toISOString();
        Object.keys(answersRef.current).forEach((field) => {
            submissionObj[field] = answersRef.current[field as keyof PostSurveyData];
        });
        graphs.map((graph, i) => {
            submissionObj[`graphFilename${i}`] = graph.filename;
            submissionObj[`graphSummaryType${i}`] = graph.summaryType;
        })
        submissionObj["spokenQuestions1"] = spokenQuestions1.toLocaleString();
        submissionObj["spokenQuestions2"] = spokenQuestions2.toLocaleString();

        try {
            await firestore.addDoc(collectionRef, submissionObj);
            setIsSubmitted(true);
        } catch (error) {
            setError("Server error. Please try again later.");
        }
    }

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
                        label={"1. Please answer all questions independently and to the best of your ability. Since you were identified as a screen reader user on Prolific, you must use your screen reader to take this survey. If do not use your screen reader for the following questions, your submission will be disqualified.\n\n\n\nThe use of artificial intelligence tools or copying and pasting from external sources is strictly prohibited. Any indication of such use will result in the immediate return of your submission and will disqualify your participation. Type \"Yes\" if you understand."}
                        controlledValue={answersRef.current.initialScreener}
                        onChange={(value) => handleChange("initialScreener", value)}
                   />

                   <TextQuestion
                        label={"2. To proceed with the survey, type \"I agree\" in the box below. This confirms you have read the consent form from the previous page and agree to participate in this research study."}
                        controlledValue={answersRef.current.informedConsentScreener}
                        onChange={(value) => handleChange("informedConsentScreener", value)}
                   />

                   <MultipleChoiceQuestion
                        key="BLVNDScreener"
                        label="3. Do you identify as blind, low-vision, or neurodivergent?"
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
                        label="4. Do you use screen readers? (for example, NVDA, JAWS)"
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
                        label="5. Are you currently using your screen reader while taking this survey?"
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
                        label="6. What is your age?"
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
                        label="7. What is your self-identified race and ethnicity?"
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
                        label="8. What is your highest level of education?"
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
                        label="9. Which of the following blind, low-vision, or neurodivergent conditions apply to you? (Select all that apply)"
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
                        label="10. Which screen readers do you use? (Select all that apply)"
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
                        label="11. How confident are you (on a 4-point scale: Not at all to Extremely) in interpreting data from charts?"
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
                        label="12. Do you have any formal training in data literacy (for example, coursework, workshops)? If so, describe it briefly."
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
                        summaryType={graphs[0].summaryType}
                        onQuestionAsk={(spokenQuestion: string) => setSpokenQuestions1(prev => [...prev, spokenQuestion])}
                    />

                    <TextQuestion
                        key="findAndAnswer1"
                        label={`13. ${graphs[0].question}`}
                        controlledValue={answersRef.current.findAndAnswer1}
                        onChange={(value) => handleChange("findAndAnswer1", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence1"
                        label={"14. To what extent do you agree with the following statement?: \"I am confident my answer was correct.\""}
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
                        label={"15. To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\""}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness1}
                        onChange={(value) => handleChange("informativeness1", value)}
                    />

                    {summaryOrderType === 1 &&
                        <MultipleChoiceQuestion
                            key="qaInformativeness1"
                            label={"16. To what extent do you agree with the following statement?: \"I could rely on the summary, along with the Q&A feature, to interpret the chart.\""}
                            options={[
                                "1 (Not at all)",
                                "2",
                                "3",
                                "4 (Extremely)"
                            ]}
                            controlledValue={answersRef.current.qaInformativeness1}
                            onChange={(value) => handleChange("qaInformativeness1", value)}
                        />}

                    <MultipleChoiceQuestion
                        key="usability1"
                        label={`${summaryOrderType === 1 ? "17" : "16"}. To what extent do you agree with the following statement?: \"It was easy to understand the summary.\"`}
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
                        summaryType={graphs[1].summaryType}
                        onQuestionAsk={(spokenQuestion: string) => setSpokenQuestions2(prev => [...prev, spokenQuestion])}
                    />

                    <TextQuestion
                        key="findAndAnswer2"
                        label={`${summaryOrderType === 1 ? "18" : "17"}.${graphs[1].question}`}
                        controlledValue={answersRef.current.findAndAnswer2}
                        onChange={(value) => handleChange("findAndAnswer2", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence2"
                        label={`${summaryOrderType === 1 ? "19" : "18"}.To what extent do you agree with the following statement?: \"I am confident my answer was correct.\"`}
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
                        label={`${summaryOrderType === 1 ? "20" : "19"}. To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\"`}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness2}
                        onChange={(value) => handleChange("informativeness2", value)}
                    />

                    {summaryOrderType === 1 &&
                        <MultipleChoiceQuestion
                            key="qaInformativeness2"
                            label={"21. To what extent do you agree with the following statement?: \"I could rely on the summary, along with the Q&A feature, to interpret the chart.\""}
                            options={[
                                "1 (Not at all)",
                                "2",
                                "3",
                                "4 (Extremely)"
                            ]}
                            controlledValue={answersRef.current.qaInformativeness2}
                            onChange={(value) => handleChange("qaInformativeness2", value)}
                        />}

                    <MultipleChoiceQuestion
                        key="usability2"
                        label={`${summaryOrderType === 1 ? "22" : "20"}. To what extent do you agree with the following statement?: \"It was easy to understand the summary.\"`}
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
                        summaryType={graphs[2].summaryType}
                        onQuestionAsk={(spokenQuestion: string) => setSpokenQuestions1(prev => [...prev, spokenQuestion])}
                    />

                    <TextQuestion
                        key="findAndAnswer3"
                        label={`${summaryOrderType === 1 ? "23" : "21"}. ${graphs[2].question}`}
                        controlledValue={answersRef.current.findAndAnswer3}
                        onChange={(value) => handleChange("findAndAnswer3", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence3"
                        label={`${summaryOrderType === 1 ? "24" : "22"}. To what extent do you agree with the following statement?: \"I am confident my answer was correct.\"`}
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
                        label={`${summaryOrderType === 1 ? "25" : "23"}.To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\"`}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness3}
                        onChange={(value) => handleChange("informativeness3", value)}
                    />

                    {summaryOrderType === 2 &&
                        <MultipleChoiceQuestion
                            key="qaInformativeness1"
                            label={`24. To what extent do you agree with the following statement?: \"I could rely on the summary, along with the Q&A feature, to interpret the chart.\"`}
                            options={[
                                "1 (Not at all)",
                                "2",
                                "3",
                                "4 (Extremely)"
                            ]}
                            controlledValue={answersRef.current.qaInformativeness1}
                            onChange={(value) => handleChange("qaInformativeness1", value)}
                        />}

                    <MultipleChoiceQuestion
                        key="usability3"
                        label={`${summaryOrderType === 1 ? "26" : "25"}. To what extent do you agree with the following statement?: \"It was easy to understand the summary.\"`}
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
                        summaryType={graphs[3].summaryType}
                        onQuestionAsk={(spokenQuestion: string) => setSpokenQuestions2(prev => [...prev, spokenQuestion])}
                    />

                    <TextQuestion
                        key="findAndAnswer4"
                        label={`${summaryOrderType === 1 ? "27" : "26"}. ${graphs[3].question}`}
                        controlledValue={answersRef.current.findAndAnswer4}
                        onChange={(value) => handleChange("findAndAnswer4", value)}
                    />
                    
                    <MultipleChoiceQuestion
                        key="confidence4"
                        label={`${summaryOrderType === 1 ? "28" : "27"}. To what extent do you agree with the following statement?: \"I am confident my answer was correct.\"`}
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
                        label={`${summaryOrderType === 1 ? "29" : "28"}. To what extent do you agree with the following statement?: \"I could rely on this summary alone to interpret the chart.\"`}
                        options={[
                            "1 (Not at all)",
                            "2",
                            "3",
                            "4 (Extremely)"
                        ]}
                        controlledValue={answersRef.current.informativeness4}
                        onChange={(value) => handleChange("informativeness4", value)}
                    />

                    {summaryOrderType === 2 &&
                        <MultipleChoiceQuestion
                            key="qaInformativeness2"
                            label={`29. To what extent do you agree with the following statement?: \"I could rely on the summary, along with the Q&A feature, to interpret the chart.\"`}
                            options={[
                                "1 (Not at all)",
                                "2",
                                "3",
                                "4 (Extremely)"
                            ]}
                            controlledValue={answersRef.current.qaInformativeness2}
                            onChange={(value) => handleChange("qaInformativeness2", value)}
                        />}

                    <MultipleChoiceQuestion
                        key="usability4"
                        label={"30. To what extent do you agree with the following statement?: \"It was easy to understand the summary.\""}
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
                        label={"31. Based on your interaction with the chart summarizer, what would you rate your experience from 1 (Very Negative) to 4 (Very Positive)?"}
                        options={[
                            "1 (Very Negative)",
                            "2 (Slightly Negative)",
                            "3 (Slightly Positive)",
                            "4 (Very Positive)"
                        ]}
                        controlledValue={answersRef.current.chartSummarizerRating}
                        onChange={(value) => handleChange("chartSummarizerRating", value)}
                    />

                    <MultipleChoiceQuestion
                        label={"32. Based on your interaction with the chart Q&A feature, what would you rate your experience from 1 (Very Negative) to 4 (Very Positive)?"}
                        options={[
                            "1 (Very Negative)",
                            "2 (Slightly Negative)",
                            "3 (Slightly Positive)",
                            "4 (Very Positive)"
                        ]}
                        controlledValue={answersRef.current.qaRating}
                        onChange={(value) => handleChange("qaRating", value)}
                    />

                    <MultipleChoiceQuestion
                        label={"33. Based on your interaction with the chart summarizer, would you incorporate this tool into your life?"}
                        options={[
                            "Yes",
                            "No",
                            "Maybe"
                        ]}
                        controlledValue={answersRef.current.wouldYouUse}
                        onChange={(value) => handleChange("wouldYouUse", value)}
                    />

                    <TextQuestion
                        label={"34. Please provide feedback on your overall experience with the chart summarizer. Answer in at least 2-3 sentences."}
                        controlledValue={answersRef.current.chartSummarizerFeedback}
                        onChange={(value) => handleChange("chartSummarizerFeedback", value)}
                    />

                    <TextQuestion
                        label={"35. Please provide feedback on your experience with the Q&A feature. Answer in at least 2-3 sentences."}
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
                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: 'smooth'
                        });
                    } else {
                        handleFormSubmission();
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