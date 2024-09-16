import { NavBar } from "./components/NavBar";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Banner } from "./components/Banner";
export default function App() {
  return (
    <div className="App">
      <NavBar />
      <Banner />
    </div>
  );
}
