import debug from "debug";
import express from "express";
import http from "http";
import { Server as SocketIO } from "socket.io";
import mongoose from "mongoose";
import ImgRouter from "./route/index";
import path from "path";
import cors from "cors";
import ImgController from "./controller/index";

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");
const url =
  "mongodb://root:abcd1234@localhost:27020/test_db?maxPoolSize=20&w=majority";
const connectDB = async () => {
  try {
    await mongoose.connect(url);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log("Connect failed");
  }
};
connectDB();
require("dotenv").config(
  process.env.NODE_ENV !== "development"
    ? { path: ".env.production" }
    : { path: ".env.development" },
);

const app = express();
const port =
  process.env.PORT || (process.env.NODE_ENV !== "development" ? 80 : 3002); // default port to listen
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use("/api/v1/images", ImgRouter);
app.use(
  "/images/view",
  express.static(
    path.join(path.dirname(__dirname).concat("/public"), "upload"),
  ),
);
// console.log(path.join(path.dirname(__dirname).concat("/public"), "upload"));
app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});
const server = http.createServer(app);
server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

try {
  const io = new SocketIO(server, {
    transports: ["websocket", "polling"],
    cors: {
      allowedHeaders: ["Content-Type", "Authorization"],
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    ioDebug("connection established!");
    io.to(`${socket.id}`).emit("init-room");
    socket.on("join-room", async (roomID) => {
      socketDebug(`${socket.id} has joined ${roomID}`);
      await socket.join(roomID);
      const sockets = await io.in(roomID).fetchSockets();
      if (sockets.length <= 1) {
        io.to(`${socket.id}`).emit("first-in-room");
      } else {
        socketDebug(`${socket.id} new-user emitted to room ${roomID}`);
        socket.broadcast.to(roomID).emit("new-user", socket.id);
      }

      io.in(roomID).emit(
        "room-user-change",
        sockets.map((socket) => socket.id),
      );
    });

    socket.on(
      "server-broadcast",
      (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
        socketDebug(`${socket.id} sends update to ${roomID}`);
        socket.broadcast.to(roomID).emit("client-broadcast", encryptedData, iv);
      },
    );

    socket.on(
      "server-volatile-broadcast",
      (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
        socketDebug(`${socket.id} sends volatile update to ${roomID}`);
        socket.volatile.broadcast
          .to(roomID)
          .emit("client-broadcast", encryptedData, iv);
      },
    );

    socket.on("disconnecting", async () => {
      socketDebug(`${socket.id} has disconnected`);
      const roomIDs = [...socket.rooms];
      for (let i = 1; i < roomIDs.length; i++) {
        const roomID = roomIDs[i];
        const otherClients = (await io.in(roomID).fetchSockets()).filter(
          (_socket) => _socket.id !== socket.id,
        );
        if (otherClients.length > 0) {
          // console.log(`Room ${roomID} still running`);
          socket.broadcast.to(roomID).emit(
            "room-user-change",
            otherClients.map((socket) => socket.id),
          );
        }
        if (otherClients.length === 0) {
          console.log(`Session ${roomID} is closed`);
          ImgController.deleteRoom(roomID);
        }
      }
    });

    socket.on("disconnect", () => {
      socketDebug(`${socket.id} disconnect`);
      socket.removeAllListeners();
      socket.disconnect();
    });
  });
} catch (error) {
  console.error(error);
}