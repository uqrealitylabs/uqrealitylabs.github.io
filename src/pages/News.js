import React from "react";

import DefaultNews from "./NewsPages/DefaultNews";
import NewsError from "./NewsPages/NewsError";

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { } from "firebase/functions";

import * as NewsPages from './NewsPages';

import defaultImage from '../images/logo.png';

const firebaseConfig = {
  apiKey: "AIzaSyB1GUickwEMArTz9cgakuPzNRgK-38rDp0",
  authDomain: "uqrl-website.firebaseapp.com",
  projectId: "uqrl-website",
  storageBucket: "uqrl-website.appspot.com",
  messagingSenderId: "206129493891",
  appId: "1:206129493891:web:2fc1052e277820561c68b6",
  measurementId: "G-5N14928QGL"
};

const app = initializeApp(firebaseConfig);
global.db = getFirestore(app);

const querySnapshot = await getDocs(collection(global.db, "NewsPages"));
var all_news = {};
var all_obj = []
global.all_obj = all_obj;

querySnapshot.forEach(doc => {
  if (doc.data().visible) {
    all_news[doc.data().pathname] = doc.data().modulename;
    global.all_obj.push(doc.data())
  }
})

console.log("All News: ", all_news)

export default function News() {
  return (<div className="container">
    <div className="row gtr-200">
      <SideBarPart />
      <ThisNews />
    </div>
    <hr />
  </div>
  );
}

function ThisNews() {
  let path = window.location.pathname.split('/');
  path = path.slice(2);
  path = path.join("/");

  if (path == "") {
    return <NewsPages.DefaultNews />;
  } else if (!Object.keys(all_news).includes(path)) {
    return <NewsError />;
  } else {
    try {
      let Component = NewsPages[all_news[path]];
      return <Component />;
    } catch {

    }

  }
}

function SideBarPart() {
  return (
    <div className="col-4 col-12-mobile" id="sidebar">
      <hr className="first" />

      <hr />
      <section>
        <header>
          <h3><a href="#">Recommended</a></h3>
        </header>

        {
          all_obj.map((item, ind) => (
            <div key={ind}>
              <div className="col-4">
                <a href="#" className="image fit"><img src="../images/pic04.jpg" alt="" /></a>
              </div>
              <a href={"/news/" + item.pathname}>
                <div className="col-8">
                  <h4>{item.title}</h4>
                  <p>{item.summary}</p>
                </div>
              </a>

            </div>
          ))
        }

        <footer>
          <a href="#" className="button">All News</a>
        </footer>
      </section>
    </div>)
}