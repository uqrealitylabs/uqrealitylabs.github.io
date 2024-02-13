import React from "react";

import { initializeApp } from "firebase/app";
import { } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { } from "firebase/functions";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";


import * as NewsPages from './NewsPages';

import defaultImage from '../images/logo.png';
import { ProgressBar } from "react-bootstrap";

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
const storage = getStorage(app);

const querySnapshot = await getDocs(collection(db, "Events"));
var upcoming_events = [];
var past_events = [];
var current_date = new Date();



async function retrieveEvents() {
    await new Promise((resolve, reject) => {
        querySnapshot.forEach(doc => {
            var data = doc.data();
            if (data.visible) {
                const path = ref(storage, data.image);
                getDownloadURL(path).then(url => {
                    data.image = url;
                    resolve()
                })
                if (data.date.toDate() < current_date) {
                    past_events.push(data);
                } else {
                    upcoming_events.push(data);
        
                }
            }
        })
    })
}

await retrieveEvents();

function Upcoming() {
    return <div className="row">
        {
            upcoming_events.map((item, ind) => (
                <article key={ind} className="col-4 col-12-mobile special">
                    <a href={item.link} target="_blank" rel="noreferrer noopener" className="image featured" style={{marginBottom: '0.1em'}}><img src={item.image} alt="" /></a>
                    <header>
                        <h6>{item.date.toDate().toString().split(":").slice(0, 2).join(':')}</h6>
                        <h3><a href={item.link} target="_blank" rel="noreferrer noopener">{item.name}</a></h3>
                    </header>
                    <p className="centre">
                        {item.description}
                    </p>
                </article>
            ))

        }
    </div>
}

function Past() {
    return <div className="row">
        {
            past_events.map((item, ind) => (
                <article key={ind} className="col-4 col-12-mobile special">
                    <a href={item.link} target="_blank" rel="noreferrer noopener" className="image featured" style={{marginBottom: '0.1em'}}><img src={item.image} alt="" /></a>
                    <header>
                        <h6>{item.date.toDate().toString().split(":").slice(0, 2).join(':')}</h6>
                        <h3><a href={item.link} target="_blank" rel="noreferrer noopener">{item.name}</a></h3>
                    </header>
                    <p className="centre">
                        {item.description}
                    </p>
                </article>
            ))

        }
    </div>
}

function GetSubpage() {
    let path = window.location.pathname.split('/');
    path = path.slice(2);
    path = path.join("/");

    if (path == "" || path == "upcoming") {
        return <Upcoming />
    } else if (path == "past") {
        return <Past />
    } else {
        window.location.pathname = "404.html"
    }
}

function Events() {
    return (
        <div className="container">
            <article id="main" className="special">
                <header>
                    <h2>Events</h2>
                </header>
                <a className="image featured"><img src="../images/367484605_268085206011462_4069322954688490795_n.jpg" alt="" /></a>
                <span className="hotswap">
                    <h2><a href="/events/upcoming">Upcoming Events</a></h2>
                    <h2><a href="/events/past">Past Events</a></h2>
                </span>
                <GetSubpage />
            </article>
            <hr/>
        </div>
    );
}

export default Events;
