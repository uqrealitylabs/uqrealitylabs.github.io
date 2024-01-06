import logo from './logo.png';
import './App.css';

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { } from "firebase/firestore";
import { } from "firebase/functions";

import Navbar from 'react-bootstrap/Navbar';
import { Nav } from 'react-bootstrap';
import CubeComponent from './CubeComponent';

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
    <div className='page'>
      <h1 className="page-title">About UQ Reality Labs</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae cursus felis. Quisque facilisis augue eget neque scelerisque, in rhoncus eros consectetur. Vivamus eu dolor iaculis, suscipit nisi a, tristique sapien. Etiam pharetra condimentum venenatis. Nulla ultrices turpis luctus, egestas quam rhoncus, dapibus eros. Suspendisse fringilla augue id arcu placerat, ut maximus sapien mollis. Phasellus vel lorem eleifend, varius diam et, varius dolor. Duis ut mauris eget tortor finibus consequat ut ac arcu. Duis sit amet nisi id est molestie aliquet vitae vitae nunc. Etiam tellus est, hendrerit a eros non, condimentum vulputate quam. Donec consectetur mauris velit, sed molestie augue euismod ut.

        Suspendisse facilisis dolor eget massa lobortis efficitur. Mauris eu molestie tortor. Integer quis sagittis est. Sed lacinia dui sed gravida feugiat. Aliquam eu neque risus. Fusce vitae ipsum congue, ullamcorper nisi a, iaculis massa. Etiam tempus nulla at fermentum gravida. Nam molestie eros ut urna tristique, id interdum ipsum vestibulum. Fusce pellentesque leo non nisi tristique, pretium pharetra purus congue. Nam eu varius libero, eu tincidunt lorem. Aenean eget leo nibh. Pellentesque congue est maximus justo placerat maximus. Pellentesque elit dui, sollicitudin ac elit in, venenatis suscipit tortor. Aenean posuere, ante a sagittis aliquam, tellus ex vehicula ligula, eget ullamcorper nunc lectus sit amet leo.

        Vivamus sit amet cursus dui. Vivamus at sem justo. Vivamus vulputate cursus bibendum. Sed mollis ligula ipsum, id accumsan nulla pulvinar vel. Nullam rhoncus quis purus id bibendum. Pellentesque vulputate a velit nec scelerisque. Mauris metus magna, hendrerit efficitur porta quis, elementum egestas augue.

        Etiam eu risus id sem molestie rhoncus. Morbi ex nunc, aliquet at lorem eget, aliquet eleifend orci. Suspendisse a lorem id lectus ullamcorper feugiat a a dolor. Nullam vulputate commodo convallis. Vivamus ut ultrices orci. Phasellus ac blandit sem. Pellentesque turpis odio, placerat ac turpis sed, tempor auctor lectus. In venenatis tortor massa, vitae euismod arcu finibus sit amet. Donec eget venenatis urna. Nullam erat libero, euismod ut nisl eget, pharetra molestie erat. Cras tellus leo, suscipit eget dapibus sit amet, suscipit mollis libero. Curabitur viverra lectus neque, sit amet blandit erat blandit eget. Praesent ut suscipit nisi, id lobortis purus. In consequat ipsum ligula, id imperdiet ante mattis at.

        Etiam semper nulla eros. Ut venenatis lorem ut elit sodales, sit amet malesuada magna dapibus. Proin dapibus sagittis ipsum, mollis accumsan est commodo eget. Pellentesque semper enim convallis tortor vestibulum, sed eleifend libero feugiat. Etiam a interdum magna, eu rhoncus enim. Vivamus tortor ipsum, dictum vitae iaculis consectetur, scelerisque non mauris. Suspendisse commodo varius nisl, vitae gravida leo tristique sed. Sed vel diam dapibus, efficitur massa sit amet, faucibus quam. Fusce ligula velit, lobortis at ullamcorper nec, fringilla sit amet metus. Aliquam efficitur aliquet dolor, vel mattis tellus tincidunt eu. In non ornare ipsum, eget consectetur turpis. Vestibulum nec imperdiet nisi. Curabitur consequat tincidunt pellentesque. 
      </p>
    </div>
  );
}

function EventsPage() {
  return (
    <div className='page'>
      <h1 className="page-title">Events</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae cursus felis. Quisque facilisis augue eget neque scelerisque, in rhoncus eros consectetur. Vivamus eu dolor iaculis, suscipit nisi a, tristique sapien. Etiam pharetra condimentum venenatis. Nulla ultrices turpis luctus, egestas quam rhoncus, dapibus eros. Suspendisse fringilla augue id arcu placerat, ut maximus sapien mollis. Phasellus vel lorem eleifend, varius diam et, varius dolor. Duis ut mauris eget tortor finibus consequat ut ac arcu. Duis sit amet nisi id est molestie aliquet vitae vitae nunc. Etiam tellus est, hendrerit a eros non, condimentum vulputate quam. Donec consectetur mauris velit, sed molestie augue euismod ut.

        Suspendisse facilisis dolor eget massa lobortis efficitur. Mauris eu molestie tortor. Integer quis sagittis est. Sed lacinia dui sed gravida feugiat. Aliquam eu neque risus. Fusce vitae ipsum congue, ullamcorper nisi a, iaculis massa. Etiam tempus nulla at fermentum gravida. Nam molestie eros ut urna tristique, id interdum ipsum vestibulum. Fusce pellentesque leo non nisi tristique, pretium pharetra purus congue. Nam eu varius libero, eu tincidunt lorem. Aenean eget leo nibh. Pellentesque congue est maximus justo placerat maximus. Pellentesque elit dui, sollicitudin ac elit in, venenatis suscipit tortor. Aenean posuere, ante a sagittis aliquam, tellus ex vehicula ligula, eget ullamcorper nunc lectus sit amet leo.

        Vivamus sit amet cursus dui. Vivamus at sem justo. Vivamus vulputate cursus bibendum. Sed mollis ligula ipsum, id accumsan nulla pulvinar vel. Nullam rhoncus quis purus id bibendum. Pellentesque vulputate a velit nec scelerisque. Mauris metus magna, hendrerit efficitur porta quis, elementum egestas augue.

        Etiam eu risus id sem molestie rhoncus. Morbi ex nunc, aliquet at lorem eget, aliquet eleifend orci. Suspendisse a lorem id lectus ullamcorper feugiat a a dolor. Nullam vulputate commodo convallis. Vivamus ut ultrices orci. Phasellus ac blandit sem. Pellentesque turpis odio, placerat ac turpis sed, tempor auctor lectus. In venenatis tortor massa, vitae euismod arcu finibus sit amet. Donec eget venenatis urna. Nullam erat libero, euismod ut nisl eget, pharetra molestie erat. Cras tellus leo, suscipit eget dapibus sit amet, suscipit mollis libero. Curabitur viverra lectus neque, sit amet blandit erat blandit eget. Praesent ut suscipit nisi, id lobortis purus. In consequat ipsum ligula, id imperdiet ante mattis at.

        Etiam semper nulla eros. Ut venenatis lorem ut elit sodales, sit amet malesuada magna dapibus. Proin dapibus sagittis ipsum, mollis accumsan est commodo eget. Pellentesque semper enim convallis tortor vestibulum, sed eleifend libero feugiat. Etiam a interdum magna, eu rhoncus enim. Vivamus tortor ipsum, dictum vitae iaculis consectetur, scelerisque non mauris. Suspendisse commodo varius nisl, vitae gravida leo tristique sed. Sed vel diam dapibus, efficitur massa sit amet, faucibus quam. Fusce ligula velit, lobortis at ullamcorper nec, fringilla sit amet metus. Aliquam efficitur aliquet dolor, vel mattis tellus tincidunt eu. In non ornare ipsum, eget consectetur turpis. Vestibulum nec imperdiet nisi. Curabitur consequat tincidunt pellentesque. 
      </p>
    </div>
  );
}

function NewsPage() {
  return (
    <div className='page'>
      <h1 className="page-title">News</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae cursus felis. Quisque facilisis augue eget neque scelerisque, in rhoncus eros consectetur. Vivamus eu dolor iaculis, suscipit nisi a, tristique sapien. Etiam pharetra condimentum venenatis. Nulla ultrices turpis luctus, egestas quam rhoncus, dapibus eros. Suspendisse fringilla augue id arcu placerat, ut maximus sapien mollis. Phasellus vel lorem eleifend, varius diam et, varius dolor. Duis ut mauris eget tortor finibus consequat ut ac arcu. Duis sit amet nisi id est molestie aliquet vitae vitae nunc. Etiam tellus est, hendrerit a eros non, condimentum vulputate quam. Donec consectetur mauris velit, sed molestie augue euismod ut.

        Suspendisse facilisis dolor eget massa lobortis efficitur. Mauris eu molestie tortor. Integer quis sagittis est. Sed lacinia dui sed gravida feugiat. Aliquam eu neque risus. Fusce vitae ipsum congue, ullamcorper nisi a, iaculis massa. Etiam tempus nulla at fermentum gravida. Nam molestie eros ut urna tristique, id interdum ipsum vestibulum. Fusce pellentesque leo non nisi tristique, pretium pharetra purus congue. Nam eu varius libero, eu tincidunt lorem. Aenean eget leo nibh. Pellentesque congue est maximus justo placerat maximus. Pellentesque elit dui, sollicitudin ac elit in, venenatis suscipit tortor. Aenean posuere, ante a sagittis aliquam, tellus ex vehicula ligula, eget ullamcorper nunc lectus sit amet leo.

        Vivamus sit amet cursus dui. Vivamus at sem justo. Vivamus vulputate cursus bibendum. Sed mollis ligula ipsum, id accumsan nulla pulvinar vel. Nullam rhoncus quis purus id bibendum. Pellentesque vulputate a velit nec scelerisque. Mauris metus magna, hendrerit efficitur porta quis, elementum egestas augue.

        Etiam eu risus id sem molestie rhoncus. Morbi ex nunc, aliquet at lorem eget, aliquet eleifend orci. Suspendisse a lorem id lectus ullamcorper feugiat a a dolor. Nullam vulputate commodo convallis. Vivamus ut ultrices orci. Phasellus ac blandit sem. Pellentesque turpis odio, placerat ac turpis sed, tempor auctor lectus. In venenatis tortor massa, vitae euismod arcu finibus sit amet. Donec eget venenatis urna. Nullam erat libero, euismod ut nisl eget, pharetra molestie erat. Cras tellus leo, suscipit eget dapibus sit amet, suscipit mollis libero. Curabitur viverra lectus neque, sit amet blandit erat blandit eget. Praesent ut suscipit nisi, id lobortis purus. In consequat ipsum ligula, id imperdiet ante mattis at.

        Etiam semper nulla eros. Ut venenatis lorem ut elit sodales, sit amet malesuada magna dapibus. Proin dapibus sagittis ipsum, mollis accumsan est commodo eget. Pellentesque semper enim convallis tortor vestibulum, sed eleifend libero feugiat. Etiam a interdum magna, eu rhoncus enim. Vivamus tortor ipsum, dictum vitae iaculis consectetur, scelerisque non mauris. Suspendisse commodo varius nisl, vitae gravida leo tristique sed. Sed vel diam dapibus, efficitur massa sit amet, faucibus quam. Fusce ligula velit, lobortis at ullamcorper nec, fringilla sit amet metus. Aliquam efficitur aliquet dolor, vel mattis tellus tincidunt eu. In non ornare ipsum, eget consectetur turpis. Vestibulum nec imperdiet nisi. Curabitur consequat tincidunt pellentesque. 
      </p>
    </div>
  );
}

function ResourcesPage() {
  return (
    <div className='page'>
      <h1 className="page-title">Resources</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae cursus felis. Quisque facilisis augue eget neque scelerisque, in rhoncus eros consectetur. Vivamus eu dolor iaculis, suscipit nisi a, tristique sapien. Etiam pharetra condimentum venenatis. Nulla ultrices turpis luctus, egestas quam rhoncus, dapibus eros. Suspendisse fringilla augue id arcu placerat, ut maximus sapien mollis. Phasellus vel lorem eleifend, varius diam et, varius dolor. Duis ut mauris eget tortor finibus consequat ut ac arcu. Duis sit amet nisi id est molestie aliquet vitae vitae nunc. Etiam tellus est, hendrerit a eros non, condimentum vulputate quam. Donec consectetur mauris velit, sed molestie augue euismod ut.

        Suspendisse facilisis dolor eget massa lobortis efficitur. Mauris eu molestie tortor. Integer quis sagittis est. Sed lacinia dui sed gravida feugiat. Aliquam eu neque risus. Fusce vitae ipsum congue, ullamcorper nisi a, iaculis massa. Etiam tempus nulla at fermentum gravida. Nam molestie eros ut urna tristique, id interdum ipsum vestibulum. Fusce pellentesque leo non nisi tristique, pretium pharetra purus congue. Nam eu varius libero, eu tincidunt lorem. Aenean eget leo nibh. Pellentesque congue est maximus justo placerat maximus. Pellentesque elit dui, sollicitudin ac elit in, venenatis suscipit tortor. Aenean posuere, ante a sagittis aliquam, tellus ex vehicula ligula, eget ullamcorper nunc lectus sit amet leo.

        Vivamus sit amet cursus dui. Vivamus at sem justo. Vivamus vulputate cursus bibendum. Sed mollis ligula ipsum, id accumsan nulla pulvinar vel. Nullam rhoncus quis purus id bibendum. Pellentesque vulputate a velit nec scelerisque. Mauris metus magna, hendrerit efficitur porta quis, elementum egestas augue.

        Etiam eu risus id sem molestie rhoncus. Morbi ex nunc, aliquet at lorem eget, aliquet eleifend orci. Suspendisse a lorem id lectus ullamcorper feugiat a a dolor. Nullam vulputate commodo convallis. Vivamus ut ultrices orci. Phasellus ac blandit sem. Pellentesque turpis odio, placerat ac turpis sed, tempor auctor lectus. In venenatis tortor massa, vitae euismod arcu finibus sit amet. Donec eget venenatis urna. Nullam erat libero, euismod ut nisl eget, pharetra molestie erat. Cras tellus leo, suscipit eget dapibus sit amet, suscipit mollis libero. Curabitur viverra lectus neque, sit amet blandit erat blandit eget. Praesent ut suscipit nisi, id lobortis purus. In consequat ipsum ligula, id imperdiet ante mattis at.

        Etiam semper nulla eros. Ut venenatis lorem ut elit sodales, sit amet malesuada magna dapibus. Proin dapibus sagittis ipsum, mollis accumsan est commodo eget. Pellentesque semper enim convallis tortor vestibulum, sed eleifend libero feugiat. Etiam a interdum magna, eu rhoncus enim. Vivamus tortor ipsum, dictum vitae iaculis consectetur, scelerisque non mauris. Suspendisse commodo varius nisl, vitae gravida leo tristique sed. Sed vel diam dapibus, efficitur massa sit amet, faucibus quam. Fusce ligula velit, lobortis at ullamcorper nec, fringilla sit amet metus. Aliquam efficitur aliquet dolor, vel mattis tellus tincidunt eu. In non ornare ipsum, eget consectetur turpis. Vestibulum nec imperdiet nisi. Curabitur consequat tincidunt pellentesque. 
      </p>
    </div>
  );
}

function JoinPage() {
  return (
    <div className='page'>
      <h1 className="page-title">Join</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae cursus felis. Quisque facilisis augue eget neque scelerisque, in rhoncus eros consectetur. Vivamus eu dolor iaculis, suscipit nisi a, tristique sapien. Etiam pharetra condimentum venenatis. Nulla ultrices turpis luctus, egestas quam rhoncus, dapibus eros. Suspendisse fringilla augue id arcu placerat, ut maximus sapien mollis. Phasellus vel lorem eleifend, varius diam et, varius dolor. Duis ut mauris eget tortor finibus consequat ut ac arcu. Duis sit amet nisi id est molestie aliquet vitae vitae nunc. Etiam tellus est, hendrerit a eros non, condimentum vulputate quam. Donec consectetur mauris velit, sed molestie augue euismod ut.

        Suspendisse facilisis dolor eget massa lobortis efficitur. Mauris eu molestie tortor. Integer quis sagittis est. Sed lacinia dui sed gravida feugiat. Aliquam eu neque risus. Fusce vitae ipsum congue, ullamcorper nisi a, iaculis massa. Etiam tempus nulla at fermentum gravida. Nam molestie eros ut urna tristique, id interdum ipsum vestibulum. Fusce pellentesque leo non nisi tristique, pretium pharetra purus congue. Nam eu varius libero, eu tincidunt lorem. Aenean eget leo nibh. Pellentesque congue est maximus justo placerat maximus. Pellentesque elit dui, sollicitudin ac elit in, venenatis suscipit tortor. Aenean posuere, ante a sagittis aliquam, tellus ex vehicula ligula, eget ullamcorper nunc lectus sit amet leo.

        Vivamus sit amet cursus dui. Vivamus at sem justo. Vivamus vulputate cursus bibendum. Sed mollis ligula ipsum, id accumsan nulla pulvinar vel. Nullam rhoncus quis purus id bibendum. Pellentesque vulputate a velit nec scelerisque. Mauris metus magna, hendrerit efficitur porta quis, elementum egestas augue.

        Etiam eu risus id sem molestie rhoncus. Morbi ex nunc, aliquet at lorem eget, aliquet eleifend orci. Suspendisse a lorem id lectus ullamcorper feugiat a a dolor. Nullam vulputate commodo convallis. Vivamus ut ultrices orci. Phasellus ac blandit sem. Pellentesque turpis odio, placerat ac turpis sed, tempor auctor lectus. In venenatis tortor massa, vitae euismod arcu finibus sit amet. Donec eget venenatis urna. Nullam erat libero, euismod ut nisl eget, pharetra molestie erat. Cras tellus leo, suscipit eget dapibus sit amet, suscipit mollis libero. Curabitur viverra lectus neque, sit amet blandit erat blandit eget. Praesent ut suscipit nisi, id lobortis purus. In consequat ipsum ligula, id imperdiet ante mattis at.

        Etiam semper nulla eros. Ut venenatis lorem ut elit sodales, sit amet malesuada magna dapibus. Proin dapibus sagittis ipsum, mollis accumsan est commodo eget. Pellentesque semper enim convallis tortor vestibulum, sed eleifend libero feugiat. Etiam a interdum magna, eu rhoncus enim. Vivamus tortor ipsum, dictum vitae iaculis consectetur, scelerisque non mauris. Suspendisse commodo varius nisl, vitae gravida leo tristique sed. Sed vel diam dapibus, efficitur massa sit amet, faucibus quam. Fusce ligula velit, lobortis at ullamcorper nec, fringilla sit amet metus. Aliquam efficitur aliquet dolor, vel mattis tellus tincidunt eu. In non ornare ipsum, eget consectetur turpis. Vestibulum nec imperdiet nisi. Curabitur consequat tincidunt pellentesque. 
      </p>
    </div>
  );
}

function Page() {
  switch(window.location.pathname) {
    case "/about":
      return <AboutPage/>;
    case "/events":
      return <EventsPage/>;
    case "/news":
      return <NewsPage/>;
    case "/resources":
      return <ResourcesPage/>;
    case "/join":
      return <JoinPage/>;
    case "/":
      return <CubeComponent/>;
    default:
      return <CubeComponent/>;
  }
}

export default App;
