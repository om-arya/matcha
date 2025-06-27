import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PromptComparer from './PromptComparer.tsx';
import GraphComparer from './GraphComparer.tsx';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root path to /prompt for convenience */}
        <Route path="/" element={<Navigate to="/prompt" replace />} />
        <Route path="/prompt" element={<PromptComparer />} />
        <Route path="/graph" element={<GraphComparer />} />
      </Routes>
    </Router>
  );
}

export default App;