import logo from './logo.svg';
import './App.css';

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { } from "firebase/firestore";
import { } from "firebase/functions";

const firebaseConfig = {

};

/* const fbApp = */ initializeApp(firebaseConfig);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          UQ Reality Labs
        </p>
      </header>
    </div>
  );
}

export default App;
