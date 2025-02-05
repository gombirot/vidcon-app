import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import VideoEditor from './pages/VideoEditor';
import Navigation from './components/Navigation';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor" element={<VideoEditor />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;