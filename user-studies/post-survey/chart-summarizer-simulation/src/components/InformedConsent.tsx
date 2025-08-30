import '../styles/InformedConsent.css';

function InformedConsent() {
    return (
        <div className="informed-consent" tabIndex={0}>
            <p>Please review the Informed Consent Form before continuing.</p>
            <p>The content of the Informed Consent Form is presented in its entirety below:</p>
            
            <div>
                <p>INFORMATION SHEET<br />
                MATCHA - ACCESSIBLE CHART INTERPRETATION AND REDESIGN ASSISTANT<br />
                HUM00275089</p>

                <p>Principal Investigator: Steve Wilson<br />
                Co-investigator: Audrey Michal<br />
                Faculty Advisor: Steve Wilson</p>

                <p>You are invited to participate in a research study about improving digital accessibility in data visualizations for blind, low-vision, and neurodivergent individuals.</p>

                <p>If you agree to be part of the research study, you will be asked to complete a one-hour online session. You will review charts with MATCHA-generated plain-language summaries and answer questions to assess their clarity and usefulness.</p>

                <p><strong>Benefits of the research:</strong><br />
                While you may not benefit directly, your participation will help shape the development of accessible data tools.<br />
                Your feedback will contribute to improving online accessibility for many users with visual or cognitive disabilities.</p>

                <p><strong>Risks and discomforts:</strong><br />
                This study involves minimal risk. Some participants may experience:<br />
                • Mild eye strain or screen fatigue<br />
                • Temporary cognitive fatigue from interpreting visual content<br />
                You may take breaks or stop at any point.</p>

                <p><strong>Compensation:</strong><br />
                You will receive $15.00 USD via Prolific upon completion. If you withdraw early, you will receive partial compensation proportional to your time spent.<br />
                If you receive any payments for taking part in this study, the University of Michigan finance department will need your name and address for tax reporting purposes.</p>

                <p>If you receive any payments for taking part in this study, the University of Michigan finance department will need your name and address for tax reporting purposes. In a calendar year if: 1) your payments total greater than $400 for this study or 2) if you receive payments of greater than $400 for being in more than one study, the University of Michigan finance department will also require your Social Security Number for tax reporting purposes. If you do not wish to provide your Social Security Number, you may continue to participate in research studies, but you will not be able to receive payment for the remainder of the calendar year.</p>

                <p>Participating in this study is completely voluntary. Even if you decide to participate now, you may change your mind and stop at any time. You may choose not to answer any survey question or continue the session for any reason.</p>

                <p>We will protect the confidentiality of your research records by securely storing your Prolific ID, survey responses, task timings, and comprehension question answers in a private Google Drive folder accessible only to the research team. No names, addresses, or identifying information will be collected. Any data used in publications will be anonymized.</p>

                <p>Your research information will be stored electronically on the cloud. The term “cloud” refers to large computers in various locations where files are securely stored and accessed online. We use Google Drive, which complies with University of Michigan standards for data protection.</p>

                <p>If you tell us or we learn something that makes us believe that you or others have been or may be abused, neglected, or exploited, we may, and in some cases must, report that information to the appropriate agencies. Information collected in this project may be shared with other researchers, but we will not share any information that could identify you.</p>

                <p>If you have questions about this research study, please contact:<br />
                Dr. Steve Wilson (PI) - steverw@umich.edu<br />
                Lauren Kahn (Student Researcher) - klaure@umich.edu<br />
                Jaime Soto (Student Researcher) - jaimeso@umich.edu<br />
                Om Arya (Student Researcher) - omarya@umich.edu</p>

                <p>As part of their review, the University of Michigan Institutional Review Board Health Sciences and Behavioral Sciences has determined that this study is no more than minimal risk and exempt from ongoing IRB oversight.</p>
            </div>
        </div>
    );
}

export default InformedConsent;