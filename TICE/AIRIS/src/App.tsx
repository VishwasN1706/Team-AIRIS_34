import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './components/Landing';
import { IPDetails } from './components/IPDetails';
import 'leaflet/dist/leaflet.css';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/details/:ip" element={<IPDetails />} />
      </Routes>
    </Router>
  );
}