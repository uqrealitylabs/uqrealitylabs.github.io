import "./App.css";

import CubeComponent from "./components/CubeComponent.js";

import About from "./pages/About.js";
import Resources from "./pages/Resources.js";
import News from "./pages/News.js";
import Events from "./pages/Events.js";
import Join from "./pages/Join.js";

import NavBarHTML from './components/NavBar.js';
import HomepageHTML from './components/HomePage.js';
import Footer from './components/Footer.js';
import Roadmap from './components/Roadmap.js';

function App() {
  return (
    <>
      <Welcome />
      <Page />
      <Footer />
    </>
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
        <div id="header" style={{ height: "default", minHeight: "default" }}>
          <NavBarHTML />
        </div>
      </>
    case "":
    default:
      return <div id="header" style={{
        height: "100vh", minHeight: "40em",
        backgroundImage: "url('images/Banner Design Smaller.png')",
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center bottom',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',

      }}>
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
          {/* <CubeComponent/> */}
          {/* <Roadmap/> */}
        </>
      );
    default:
      window.location.pathname = "/404.html";
  }
}

export default App;
