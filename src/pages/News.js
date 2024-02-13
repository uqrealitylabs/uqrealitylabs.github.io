import React from "react";

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
const db = getFirestore(app);

const querySnapshot = await getDocs(collection(db, "NewsPages"));
var all_news = {};
var all_obj = []

querySnapshot.forEach(doc => {
  if (doc.data().visible) {
    all_news[doc.data().pathname] = doc.data().modulename;
    all_obj.push(doc.data())
  }
})

export default function News() {
  return (<div id="main" className="container">
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
    return <DefaultNews />;
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

function DefaultNews() {
    return (<div className="col-8 col-12-mobile imp-mobile" id="content">
              <article id="main">
                  <header>
                      <h2>All News</h2>
                  </header>

                    {
            all_obj.map((item, ind) => (
              <section key={ind}>
                <a href={"/news/" + item.pathname}>
                <header>
                  <h3>{item.title}</h3>
                </header>
                <p>
                  {item.summary}
                </p>
                
                </a>

              </section>
            ))
          }
              </article>
          </div>)
    }

function SideBarPart() {
  return (
    <div className="col-4 col-12-mobile" id="sidebar">
      <hr className="first" />

      <hr />
      <section>
        <header>
          <h3>Recommended</h3>
        </header>
      </section>
      <section>

        <div className="row gtr-50">
          {
            all_obj.map((item, ind) => (
              <>
                <div key={2*ind} className="col-4">
                  <a href="#" className="image fit"><img src="../images/pic04.jpg" alt="" /></a>
                </div>
                <div key={2*ind + 1} className="col-8">
                  <a href={"/news/" + item.pathname}>
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                  </a>
                </div>
              </>
            ))
        }
        </div>

        <footer>
          <a href="/news" className="button">All News</a>
        </footer>
      </section>
    </div>
    )
}