require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 9000
http.listen(port, () => console.log(`http://localhost:${port}`));

const Twitter = require("twitter");
const client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret,
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

var tw;

const stream = (socket, track) =>
  client.stream("statuses/filter", { track: track }, (stream) => {
    stream.on("data", (event) => {
      socket.emit("tweet", event);
    });

    stream.on("error", (error) => {
      console.log(error);
    });
    tw = stream;
  });

io.on("connection", (socket) => {
  console.log("a user connected");
  stream(socket, "twice");

  socket.on("stop", () => {
    tw.destroy();
  });

  socket.on("track", (track) => {
    tw.destroy();
    stream(socket, track);
  });

  socket.on("disconnect", () => {
    tw.destroy();
    console.log("user disconnected");
  });
});
