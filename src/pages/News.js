import React from "react";

import DefaultNews from "./NewsPages/DefaultNews";
import SideBarPart from "../components/SideBarPart";

export default function News() {
  return (<div class="container">
  <div class="row gtr-200">
      <SideBarPart/>
      <DefaultNews/>
  </div>
<hr/>
</div>
  );
}