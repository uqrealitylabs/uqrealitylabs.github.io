import logo from "./images/logo.png";
import "./App.css";

import Navbar from "react-bootstrap/Navbar";
import { Nav } from "react-bootstrap";
import CubeComponent from "./components/CubeComponent.js";

import About from "./pages/About.js";
import Resources from "./pages/Resources.js";
import News from "./pages/News.js";
import Events from "./pages/Events.js";
import Join from "./pages/Join.js";

import NavBarHTML from './components/NavBar.js';
import HomepageHTML from './components/HomePage.js';
import LeftSideBar from './components/LeftSidebar.js';
import Footer from './components/Footer.js';
import Wrapper1 from './components/Wrapper1.js';
import Wrapper2 from './components/Wrapper2.js';

function App() {
  return (
    <>
    <Welcome/>
    <Page/>
    <Footer/>
    </>
  );
}

function Navigation() {
  return (
    <Navbar fixed="top" expand="lg" className="bg-body-tertiary main-nav d-flex align-items" variant="underline">
      <Navbar.Brand href="#home">
        <img src={logo} alt="uqrl logo" className="nav-brand" onClick={() => {window.location.pathname = "/";}}/>
      </Navbar.Brand>
      {/* <Navbar.Toggle aria-controls="responsive-navbar-nav" /> */}
      <Nav className="nav-links me-auto">
        <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/about";}}>
          About
        </Nav.Link>
        <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/events";}}>
          Events
        </Nav.Link>
        <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/news";}}>
          News
        </Nav.Link>
        <Nav.Link className="nav-tabs" onClick={() => {window.location.pathname = "/resources";}}>
          Resources
        </Nav.Link>
        <Nav.Link
          className="nav-tabs"
          onClick={() => {
            window.location.pathname = "/contact";
          }}
        >
          Contact
        </Nav.Link>
        <Nav.Link
          className="nav-tabs"
          onClick={() => {
            window.location.pathname = "/join";
          }}
        >
          Join
        </Nav.Link>
      </Nav>
    </Navbar>
  );
}

function Welcome() {
  switch (window.location.pathname.split("/")[1]) {
    case "about":
    case "events":
    case "news":
    case "resources":
    case "join":
      return <>
        <div id="header" style={{height: "default", minHeight: "default"}}>
          <NavBarHTML />
        </div>
      </>
    case "":
    default:
      return <div id="header" style={{height: "100vh", minHeight: "40em"}}>
        <NavBarHTML />
        <HomepageHTML />
      </div>
  }
}

function Page() {
  switch (window.location.pathname.split("/")[1]) {
    case "about":
      return <About />;
    case "events":
      return <Events />;
    case "news":
      return <News />;
    case "resources":
      return <Resources />;
    case "join":
      return <Join />;
    case "":
      return (
      <> 
        <CubeComponent/>
        <Wrapper1/>
        <Wrapper2/>
      </>
      );
    default:
      return (
        <> 
          <CubeComponent/>
          <Wrapper1/>
          <Wrapper2/>
        </>
        );
  }
}

export default App;
