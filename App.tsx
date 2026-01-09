import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Entry } from './pages/Entry';
import { Settlement } from './pages/Settlement';
import { ImportPage } from './pages/Import';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;