import React from "react";

function About() {
  return (
    <div className="container">
        <article id="main" className="special">
            <header>
                <h2><a href="#">About Us</a></h2>
            </header>
            <a href="#" className="image featured"><img src="images/pic06.jpg" alt="" /></a>
            <p>
                Commodo id natoque malesuada sollicitudin elit suscipit. Curae suspendisse mauris posuere accumsan massa
                posuere lacus convallis tellus interdum. Amet nullam fringilla nibh nulla convallis ut venenatis purus
                lobortis. Auctor etiam porttitor phasellus tempus cubilia ultrices tempor sagittis. Nisl fermentum
                consequat integer interdum integer purus sapien. Nibh eleifend nulla nascetur pharetra commodo mi augue
                interdum tellus. Ornare cursus augue feugiat sodales velit lorem. Semper elementum ullamcorper lacinia
                natoque aenean scelerisque vel lacinia mollis quam sodales congue.
            </p>
            <section>
                <header>
                    <h3>Ultrices tempor sagittis nisl</h3>
                </header>
                <p>
                    Nascetur volutpat nibh ullamcorper vivamus at purus. Cursus ultrices porttitor sollicitudin imperdiet
                    at pretium tellus in euismod a integer sodales neque. Nibh quis dui quis mattis eget imperdiet venenatis
                    feugiat. Neque primis ligula cum erat aenean tristique luctus risus ipsum praesent iaculis. Fermentum elit
                    fringilla consequat dis arcu. Pellentesque mus tempor vitae pretium sodales porttitor lacus. Phasellus
                    egestas odio nisl duis sociis purus faucibus morbi. Eget massa mus etiam sociis pharetra magna.
                </p>
                <p>
                    Eleifend auctor turpis magnis sed porta nisl pretium. Aenean suspendisse nulla eget sed etiam parturient
                    orci cursus nibh. Quisque eu nec neque felis laoreet diam morbi egestas. Dignissim cras rutrum consectetur
                    ut penatibus fermentum nibh erat malesuada varius.
                </p>
            </section>
        </article>
        <hr />
        <h2 style={{"text-align": "center"}}>Meet the Team</h2>
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
        <hr/>
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
        <hr/>
    </div>
  );
}

export default About;
