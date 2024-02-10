import React from "react";

function About() {
    return (
        <div className="container">
            <article id="main" className="special">
                <header>
                    <h2><a href="">About Us</a></h2>
                </header>
                <a className="image featured"><img src="images/uqrl-top-banner.png" alt="Welcome to UQ Reality Labs!" /></a>
                <section>
                    <p>
                    Welcome to UQ Reality Labs, Australia's first augmented and virtual reality club! We are a not-for-profit student society based out of The University of Queensland, Brisbane, catering to both undergraduate and postgraduate students interested in the Extended Reality (XR) space including Augmented Reality (AR), Virtual Reality (VR), and Mixed Reality (MR). We are committed to providing an inclusive space for students of all backgrounds to learn, share and connect about everything XR related. Throughout the year we host a wide variety of events, including but not limited to networking events, workshops, demos and social nights.
                    </p>
                </section>
                {/* <hr/> */}
                <section>
                    <header>
                        <h3>Our History</h3>
                    </header>
                    <p>
                    UQ Reality Labs is a student-run society that is pioneering the advancement of virtual, mixed, and augmented reality research and development at the University of Queensland. The club was co-founded by Claudia McPherson, Jatin Pawar and Neil Reitmann in October 2022 with a mission to cultivate an interdisciplinary environment that fosters collaboration, project-based learning, and innovation to drive progress in emerging technologies. With that, Reality Labs is Australia’s first student-run AR/VR Club, aiming to provide ease of access to XR and education around it.
                    </p>
                </section>
                {/* <hr/> */}
                <section>
                    <header>
                        <h3>President's Note</h3>
                    </header>
                    <p>
                        <em>As President of UQ Reality Labs (UQRL) in 2024, I lead a community redefining XR's boundaries – not just geographically, but in terms of who gets to experience its magic. Since igniting Brisbane's XR scene in 2023, UQRL has transformed from a campus club to a national network of collaboration, blazing a trail of inclusivity and innovation. Earning the "UQ Union Best Small Club of the Year 2023" award within our first year was a thrilling nod, but our real fuel is seeing XR's potential reach all corners of the map, regardless of background or access.</em><br />
                        <em><code>&#8212;</code> Masham Siddiqui, 2024 President</em>
                    </p>
                </section>

            </article>
            <hr />
            <header>
                <h2 style={{ "text-align": "center" }}>Meet the Team</h2>
            </header>
            <hr />
            <div className="row">
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic07.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Masham Siddiqui</a></h3>
                    </header>
                    <p className="centre">
                        2024 President
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic08.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Vince Lapore</a></h3>
                    </header>
                    <p className="centre">
                        2024 Secretary
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic09.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Harrison Wills</a></h3>
                    </header>
                    <p className="centre">
                        2024 Treasurer
                    </p>
                </article>
            </div>
            <hr />
            <div className="row">
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic07.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Srikrishna Bhat</a></h3>
                    </header>
                    <p className="centre">
                        Workshop Director
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic08.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Karthikeyan Venkatesan</a></h3>
                    </header>
                    <p className="centre">
                        Growth & Engagement Director
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic09.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Jason Qu</a></h3>
                    </header>
                    <p className="centre">
                        Growth & Engagement Director
                    </p>
                </article>
            </div>
            <hr />
            <div className="row">
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic07.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Shuvodeep Saha</a></h3>
                    </header>
                    <p className="centre">
                        Industry Director
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic08.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Swaraj Randhir</a></h3>
                    </header>
                    <p className="centre">
                        Media Director
                    </p>
                </article>
                <article className="col-4 col-12-mobile special">
                    <a href="#" className="image featured"><img src="images/pic09.jpg" alt="" /></a>
                    <header>
                        <h3><a href="#">Benjamin Tran</a></h3>
                    </header>
                    <p className="centre">
                        General Director
                    </p>
                </article>
            </div>
            <hr />
        </div>
    );
}

export default About;
