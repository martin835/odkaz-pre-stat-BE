import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import app from "./app.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { verifyAccessToken } from "./auth/tools.js";
import UserModel from "./services/models/user-model.js";

let onlineUsers = [];
let onlineAdmins = [];
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
  socket.emit("welcome");
  console.log("🤝 HANDSHAKE - is there a token ?", socket.handshake);
  //This is probably a good check to have, but crashes the app if it happes...
  //...some error handler should be added...  ⬇️⬇️⬇️👇👇👇
  //if (!socket.handshake.auth.token) throw new Error("AUTHORIZATION ERROR!");

  const token = socket.handshake.auth.token;
  const payload = await verifyAccessToken(token);
  console.log(" 📦📦📦 PAYLOAD WE GOT VIA SOCKET: ", payload);

  if (payload.role === "admin" /* && !onlineAdmins.includes(payload._id) */) {
    const user = await UserModel.findById({ _id: payload._id });

    if (onlineAdmins.length > 0) {
      for (let i = 0; i < onlineAdmins.length; i++) {
        if (onlineAdmins[i]._id.toString() !== user._id.toString()) {
          onlineAdmins.push(user);
        }
      }
    } else if (onlineAdmins.length === 0) {
      onlineAdmins.push(user);
    }
  } else if (
    payload.role === "basicUser" /* &&
    !onlineUsers.includes(payload._id) */
  ) {
    const user = await UserModel.findById({ _id: payload._id });

    if (onlineUsers.length > 0) {
      for (let i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i]._id.toString() === payload._id) continue;
        else onlineUsers.push(user);
      }
    } else if (onlineUsers.length === 0) {
      onlineUsers.push(user);
    }
  }

  console.log(" 📻 👤 ONLINE USERS: ", onlineUsers);
  console.log(" 📻 👨‍💻 ONLINE ADMINS: ", onlineAdmins);

  socket.emit("onlineAdmins", onlineAdmins);
  socket.emit("onlineUsers", onlineUsers);

  socket.on("disconnect", () => {
    console.log(`❌ disconnected`);
    onlineUsers = onlineUsers.filter(
      (user) => user._id.toString() !== payload._id
    );
    onlineAdmins = onlineAdmins.filter(
      (admin) => admin._id.toString() !== payload._id
    );
    console.log(" 📻 ONLINE USERS: ", onlineUsers);
    console.log(" 📻 👨‍💻 ONLINE ADMINS: ", onlineAdmins);
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
