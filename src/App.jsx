import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Services from './pages/Services/Services';
import Appointment from './pages/Appointment/Appointment';
import Masters from './pages/Masters/Masters';
import Gallery from './pages/Gallery/Gallery';
import Contacts from './pages/Contacts/Contacts';
import Admin from './pages/Admin/Admin';
import MyAppointment from './pages/MyAppointment/MyAppointment';
import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/appointment" element={<Appointment />} />
                        <Route path="/masters" element={<Masters />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/my-appointment" element={<MyAppointment />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;