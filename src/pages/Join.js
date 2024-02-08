import React from "react";

function Students() {
    return <>
        <p>
        For students Commodo id natoque malesuada sollicitudin elit suscipit. Curae suspendisse mauris posuere accumsan massa
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
    <section>
        <header>
            <h3>Meet the Team</h3>
        </header>
        <p>
            Pretium tellus in euismod a integer sodales neque. Nibh quis dui quis mattis eget imperdiet venenatis
            feugiat. Neque primis ligula cum erat aenean tristique luctus risus ipsum praesent iaculis. Fermentum elit
            ut nunc urna volutpat donec cubilia commodo risus morbi. Lobortis vestibulum velit malesuada ante
            egestas odio nisl duis sociis purus faucibus morbi. Eget massa mus etiam sociis pharetra magna.
        </p>
    </section>
    </>
}

function Industry() {
    return <>
        <p>
        For sponsors Commodo id natoque malesuada sollicitudin elit suscipit. Curae suspendisse mauris posuere accumsan massa
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
    <section>
        <header>
            <h3>Meet the Team</h3>
        </header>
        <p>
            Pretium tellus in euismod a integer sodales neque. Nibh quis dui quis mattis eget imperdiet venenatis
            feugiat. Neque primis ligula cum erat aenean tristique luctus risus ipsum praesent iaculis. Fermentum elit
            ut nunc urna volutpat donec cubilia commodo risus morbi. Lobortis vestibulum velit malesuada ante
            egestas odio nisl duis sociis purus faucibus morbi. Eget massa mus etiam sociis pharetra magna.
        </p>
    </section>
    </>
}

function GetSubpage() {
    let path = window.location.pathname.split('/');
    path = path.slice(2);
    path = path.join("/");
    console.log(path)

    if (path == "" || path == "students") {
        return <Students/>
    } else if (path == "sponsors") {
        return <Industry/>
    } else {
        window.location.pathname = "404.html"
    }
}

function Join() {
  return (
    <div className="container">
        <article id="main" className="special">
            <header>
                <h2>Join Us!</h2>
            </header>
            <a className="image featured"><img src="../images/pic06.jpg" alt="" /></a>
            <span className="hotswap">
                <h2><a href="/join/students">For Students</a></h2>
                <h2><a href="/join/sponsors">For Sponsors</a></h2>
            </span>
            <GetSubpage/>
            <hr/>
        </article>
    </div>
  );
}

export default Join;
