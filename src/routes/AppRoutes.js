import { NavBar } from "../components/NavBar";
import "../../src/App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Banner } from "../components/Banner";
import  AuthScreen  from "../screens/Auth/AuthScreen"; 
import MainPage from "../screens/mainpage/MainPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 

export default function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<Banner />} /> {/* Rota para a página inicial */}
          <Route path="/auth" element={<AuthScreen />} /> {/* Rota para a tela de autenticação */}
          <Route path="/main" element={<MainPage/>} /> {/* Rota para a tela principal */}
        </Routes>
      </div>
    </Router>
  );
}
