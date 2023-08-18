import React, { Component } from "react";
import { Button } from "@mui/material";
import UnsecuredContent from "./UnsecuredContent";
import SecuredContent from "./SecuredContent";

/**
 * Root Application class component containing the Digital Hub Application
 * @class
 *
 */
class App extends Component {
  render() {
    return (
      <>
        <Button>Here's a button</Button>;
        <SecuredContent />
      </>
    );
  }
}

export default App;
