import {
    useEffect,
    useState
} from 'react';

export interface Chart {
  id: number;
  title: string;
  question: string;
  baseline_summary: string;
  optimized_summary: string;
  image_url?: string;
  flaws?: Record<string, boolean>;
}

export interface AssignedCharts {
  participantId: string;
  participantIndex: number;
  charts: Chart[];
}

interface ChartSummarizerSimulationProps {
  participantId: string;
}

function ChartSummarizerSimulation({participantId}: ChartSummarizerSimulationProps) {
  // participantId should be provided by the experiment runner (cookie, query param, etc.)
  const [assignedCharts, setAssignedCharts] = useState<AssignedCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!participantId) {
      setError('participantId is required');
      setLoading(false);
      return;
    }

    let abort = false;
    async function fetchAssignment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/assign-graphs?participantId=${encodeURIComponent(participantId)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const json = await res.json();
      if (!abort) {
        setAssignedCharts(json);
        setLoading(false);
      }
    } catch (e: any) {
      if (!abort) {
        setError(e.message);
        setLoading(false);
      }
    }
  }

  fetchAssignment();
  return () => { abort = true; };
  }, [participantId]);

  if (loading) return <div>Loading assignment...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!assignedCharts) return <div>No charts assigned.</div>;


  /* assignedCharts expected shape (from server):
  {
  participantId: "...",
  participantIndex: 0, // integer in [0, participants-1]
  charts: [ { id, title, question, baseline_summary, optimized_summary, flaws: {...} }, ... ]
  }
  */


  // For each participant we want 4 charts, 2 baseline prompts and 2 optimized prompts.
  // The server already selected the 4 charts. We'll deterministically decide which two
  // positions get the optimized prompt to make the UI consistent and reproducible.

  const optPositions = deterministicPickTwo(assignedCharts.participantIndex);

  return (
    <div>
      <h2>
        Chart Summarizer Simulation — Participant {assignedCharts.participantId}
      </h2>
      <ol>
        {assignedCharts.charts.map((chart, i) => {
        const promptType = optPositions.includes(i) ? 'optimized' : 'baseline';
        const promptText = promptType === 'optimized' ? chart.optimized_summary : chart.baseline_summary;
        return (
          <li key={chart.id} style={{marginBottom: '1rem'}}>
            <h3>
              {chart.title} (#{chart.id})
            </h3>
            {/* Placeholder for the actual chart image or embedding. The server could provide a URL. */}
            {chart.image_url ? <img src={chart.image_url} alt={chart.title} /> : <div>[chart rendering placeholder]</div>}

            <p>
              <strong>Question:</strong> {chart.question}
            </p>

            <div>
            <p>
              <strong>Prompt type:</strong> {promptType}
            </p>
            <p>
              <strong>Summary prompt shown to participant:</strong>
            </p>
            <pre>
              {promptText}
            </pre>
            </div>

            {/* Find-and-answer fields and Likert scales — keep them as plain inputs for now */}
            <div>
              <label>
                Find-and-answer response:
                <input name={`find_answer_${chart.id}`} type="text" />
              </label>
            </div>

            <div>
              <label>
                How confident are you in your interpretation? (1-7)
                <input name={`likert_conf_${chart.id}`} type="number" min="1" max="7" />
              </label>
            </div>

            <hr />
          </li>
        );
        })}
      </ol>
    {/* Demographics and screening will be a separate step prior to assignment. */}
    </div>
    );
}

function deterministicPickTwo(participantIndex: number): number[] {
  const seed = (participantIndex * 1664525 + 1013904223) >>> 0;
  const a = (seed % 1000) / 1000;
  const b = ((seed >> 10) % 1000) / 1000;
  const first = Math.floor(a * 4);
  let second = Math.floor(b * 4);
  if (second === first) second = (second + 1) % 4;
  return [first, second].sort();
}

export default ChartSummarizerSimulation;