import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar.tsx';
import PromptComparer from './components/PromptComparer.tsx';
import GraphComparer from './components/GraphComparer.tsx';

function App() {
  return (
    <Router>
      <Navbar />
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