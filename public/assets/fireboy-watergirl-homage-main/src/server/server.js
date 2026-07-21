const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

let socketId1 = -1;
let socketId2 = -1;
let interval;
let player1Pos = [50, 450];
let player2Pos = [740, 450];
let star1 = true;
let star2 = true;
let star3 = true;
let star4 = true;
let star5 = true;
let star6 = true;

io.on("connection", (socket) => {
  console.log("New client connected");

  if (socketId1 === -1 && socketId2 !== socket.id) {
    socketId1 = socket.id;
  }
  if (socketId2 === -1 && socketId1 !== socket.id) {
    socketId2 = socket.id;
  }

  if (socket.id === socketId1) {
    socket.join("player1");
  }

  if (socket.id === socketId2) {
    socket.join("player2");
  }

  console.log(socketId1, socketId2);

  if (interval) {
    interval = "";
  }

  interval = setInterval(() => getApiAndEmit(socket), 1000);

  socket.on("hey", (data) => {
    if (data[0] === 0) {
      player1Pos[0] = data[1];
      player1Pos[1] = data[2];
    }
    if (data[0] === 1) {
      player2Pos[0] = data[1];
      player2Pos[1] = data[2];
    }

    star1 = data[3];
    star2 = data[4];
    star3 = data[5];
    star4 = data[6];
    star5 = data[7];
    star6 = data[8];
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");

    if (socket.id === socketId1) {
      socketId1 = -1;
    }

    if (socket.id === socketId2) {
      socketId2 = -1;
    }

    if (socketId1 === -1 && socketId2 === -1) {
      player1Pos = [50, 450];
      player2Pos = [740, 450];
      star1 = true;
      star2 = true;
      star3 = true;
      star4 = true;
      star5 = true;
      star6 = true;
    }

    console.log(socketId1, socketId2);

    interval = "";
  });
});

const getApiAndEmit = () => {
  const response = {
    id: 0,
    posX: player2Pos[0],
    posY: player2Pos[1],
    star1: star1,
    star2: star2,
    star3: star3,
    star4: star4,
    star5: star5,
    star6: star6,
  };

  const response2 = {
    id: 1,
    posX: player1Pos[0],
    posY: player1Pos[1],
    star1: star1,
    star2: star2,
    star3: star3,
    star4: star4,
    star5: star5,
    star6: star6,
  };

  // Emitting a new message. Will be consumed by the client
  io.to("player1").emit("FromAPI", response);
  io.to("player2").emit("FromAPI", response2);
};

server.listen(port, () => console.log(`Listening on port ${port}`));
