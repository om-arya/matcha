import {
    useEffect,
    useState
} from 'react';
import GraphItem from './GraphItem.js';

const ChartSummarizerSimulation = () => {
  const [randomGraphs, setRandomGraphs] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Get random graphs
    setRandomGraphs(["../../graphs/3quetra_python-scripts_limes_sale_1768.png"]);
  }, []);

  return (
    <div className="simulation-container">
      {randomGraphs.map((graph, index) => (
        <GraphItem key={index} imagePath={graph} altText={`Graph ${index + 1}`} />
      ))}
    </div>
  );
};

export default ChartSummarizerSimulation;