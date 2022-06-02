import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import app from "./app.js";
import { Server } from "socket.io";
import { createServer } from "http";

let onlineUsers = [];
// Server connection

const port = process.env.PORT || 3001;

if (!process.env.MONGO_CONNECTION) {
  throw new Error("No Mongo url");
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  origin: "https://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
});

io.on("connection", async (socket) => {
  console.log("🔛 SOCKET ID: ", socket.id);
  console.log(
    "🤝 HANDSHAKE - is there a token in the headers ? : ",
    socket.handshake
  );

  socket.emit("welcome");

  socket.on("disconnect", () => {
    console.log(`❌ disconnected`);
    console.log(" 📻 ONLINE USERS: ", onlineUsers);
  });
});

mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("👌 Connected to Mongo!");

  httpServer.listen(port, () => {
    console.table(listEndpoints(app));
    console.log(`🟢 Server listening on port ${port} 🚀 `);
  });
});
