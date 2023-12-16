import logo from './logo.png';
import './App.css';

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { } from "firebase/firestore";
import { } from "firebase/functions";

import Navbar from 'react-bootstrap/Navbar';
import { Nav } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';

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
      <Navbar expand="lg" className="bg-body-tertiary main-nav d-flex align-items" variant="underline">
          <Navbar.Brand href="#home">
            <img src={logo} className='nav-brand'/>
          </Navbar.Brand>
          <Nav className="nav-links">
            <Nav.Link className="nav-tabs">About</Nav.Link>
            <Nav.Link className="nav-tabs">Events</Nav.Link>
            <Nav.Link className="nav-tabs">Newsletters</Nav.Link>
            <Nav.Link className="nav-tabs">Resources</Nav.Link>
            <Nav.Link className="nav-tabs">Join</Nav.Link>
          </Nav>

      </Navbar>
    
  );
}

function BasicExample() {
  return (
    <Nav
      activeKey="/home"
      onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}
    >
      <Nav.Item>
        <Nav.Link href="/home">Active</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-1">Link</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-2">Link</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="disabled" disabled>
          Disabled
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default App;
