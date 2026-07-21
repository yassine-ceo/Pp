import Phaser from "phaser";
import React from "react";
import ReactDOM from "react-dom";
import App from "./react/App.js";
import menu from "./phaser/menu";
import playGame from "./phaser/playGame";

//console.log(App);

export const config = {
  type: Phaser.AUTO,
  parent: "phaser",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
  },
  scene: [playGame],
};

const game = new Phaser.Game(config);

ReactDOM.render(
  <App />,
  document.getElementById("root") || document.createElement("div")
);
