import logo from './logo.png';
import './App.css';

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { } from "firebase/firestore";
import { } from "firebase/functions";

import Navbar from 'react-bootstrap/Navbar';
import { Nav } from 'react-bootstrap';

const firebaseConfig = {

};

/* const fbApp = */ initializeApp(firebaseConfig);

function App() {
  return (
    <>
      <Navigation/>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            UQ Reality Labs
          </p>

        </header>
      </div>
    </>
  );
}

function Navigation() {
  return (
      <Navbar fixed="top" expand="lg" className="bg-body-tertiary main-nav d-flex align-items" variant="underline">
          <Navbar.Brand href="#home">
            <img src={logo} alt="uqrl logo" className='nav-brand'/>
          </Navbar.Brand>
          {/* <Navbar.Toggle aria-controls="responsive-navbar-nav" /> */}
            <Nav className="nav-links me-auto">
              <Nav.Link className="nav-tabs">About</Nav.Link>
              <Nav.Link className="nav-tabs">Events</Nav.Link>
              <Nav.Link className="nav-tabs">News</Nav.Link>
              <Nav.Link className="nav-tabs">Resources</Nav.Link>
              <Nav.Link className="nav-tabs">Join</Nav.Link>
            </Nav>  

      </Navbar>
    
  );
}


export default App;
