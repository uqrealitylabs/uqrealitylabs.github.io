import logo from './logo.png';
import './App.css';

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { } from "firebase/firestore";
import { } from "firebase/functions";

import Navbar from 'react-bootstrap/Navbar';
import { Nav } from 'react-bootstrap';
import CubeComponent from './CubeComponent'

const firebaseConfig = {

};

/* const fbApp = */ initializeApp(firebaseConfig);

function App() {
  return (
    <>
      <Navigation/>
      <Page/>
    </>
  );
}

function Navigation() {
  return (
      <Navbar fixed="top" expand="lg" className="bg-body-tertiary main-nav d-flex align-items" variant="underline">
          <Navbar.Brand href="#home">
            <img src={logo} alt="uqrl logo" className='nav-brand' onClick={() => {window.location.pathname = "/"}}/>
          </Navbar.Brand>
          {/* <Navbar.Toggle aria-controls="responsive-navbar-nav" /> */}
            <Nav className="nav-links me-auto">
              <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/about"}}>About</Nav.Link>
              <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/events"}}>Events</Nav.Link>
              <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/news"}}>News</Nav.Link>
              <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/resources"}}>Resources</Nav.Link>
              <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/join"}}>Join</Nav.Link>
            </Nav>  

      </Navbar>
    
  );
}

function AboutPage() {
  return (
    <>
      <p></p>
    </>
  );
}

function Page() {
  switch(window.location.pathname) {
    case "/about":
      return <AboutPage/>
    default:
      return <CubeComponent/>;
  }
}

export default App;
