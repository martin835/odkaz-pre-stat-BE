import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import app from "./app.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { verifyAccessToken } from "./auth/tools.js";
import UserModel from "./services/models/user-model.js";
import ChatModel from "./services/models/chat-model.js";
import ChatMessageModel from "./services/models/chatMessage-model.js";

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
  //socket.emit("welcome");
  //console.log("🤝 HANDSHAKE - is there a token ?", socket.handshake);
  //This is probably a good check to have, but crashes the app if it happes...
  //...some error handler should be added...  ⬇️⬇️⬇️👇👇👇
  //console.log(socket.handshake.auth.token);
  if (socket.handshake.auth.token) {
    const token = socket.handshake.auth.token;
    const payload = await verifyAccessToken(token);
    //console.log(" 📦📦📦 PAYLOAD WE GOT VIA SOCKET: ", payload);

    if (payload.role === "admin") {
      const user = await UserModel.findById(
        { _id: payload._id },
        "_id avatar name"
      );

      if (
        onlineAdmins.length > 0 &&
        onlineAdmins.filter(
          (admin) => admin._id.toString() === user._id.toString()
        ).length === 0
      ) {
        onlineAdmins.push(user);
      } else if (onlineAdmins.length === 0) {
        // console.log(
        //   "ONLINE ADMINS LENGHT IS 0 so I push this one to array:",
        //   user
        // );
        onlineAdmins.push(user);
      }
    } else if (payload.role === "basicUser") {
      const user = await UserModel.findById(
        { _id: payload._id },
        "_id avatar name"
      );

      if (
        onlineUsers.length > 0 &&
        onlineUsers.filter(
          (basicUser) => basicUser._id.toString() === user._id.toString()
        ).length === 0
      ) {
        onlineUsers.push(user);
      } else if (onlineUsers.length === 0) {
        onlineUsers.push(user);
      }
    }

    // console.log(" 📻 👤 ONLINE USERS: ", onlineUsers);
    console.log(" 📻 👨‍💻 ONLINE ADMINS 1: ", onlineAdmins);

    socket.emit("onlineAdmins", onlineAdmins);
    //socket.emit("onlineUsers", onlineUsers);

    // grabbing chats for this user....
    const userChats = await ChatModel.find({
      members: { $all: [payload._id] },
    });
    // console.log(
    //   ` 👩‍👩‍👧‍👧THESE ARE CHATS THIS USER ${payload.username} IS MEMBER OF: `,
    //   userChats
    // );

    const chats = userChats.map((chat) => chat._id.toString());
    //console.log("THIS IS ARRAY WITH CHAT IDs TO JOIN: ", chats);
    socket.join(chats);

    socket.on("outgoingMessage", async ({ data, chat }) => {
      console.log("MESSAGE FROM FE: ", data);
      console.log("CHAT ID: ", chat);
      console.log("payload._id (= user id): ", payload._id);

      const message = {
        sender: mongoose.Types.ObjectId(payload._id),
        ...data,
      };

      const newMessage = new ChatMessageModel(message);
      const { _id } = await newMessage.save();

      //console.log("MESSAGE IM TRYING TO PUSH TO DB: ", message);
      // here we will save the message to our database...
      await ChatModel.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(chat) },
        { $push: { messages: _id } }
      );

      socket.to(chat).emit("incomingMessage", { newMessage });
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.id} disconnected`);
      onlineUsers = onlineUsers.filter(
        (user) => user._id.toString() !== payload._id
      );
      onlineAdmins = onlineAdmins.filter(
        (admin) => admin._id.toString() !== payload._id
      );
      socket.emit("onlineAdmins", onlineAdmins);
      //socket.emit("onlineUsers", onlineUsers)
      // console.log(" 📻 ONLINE USERS: ", onlineUsers);
      console.log(" 📻 👨‍💻 ONLINE ADMINS 2: ", onlineAdmins);
    });
  } else if (!socket.handshake.auth.token) {
    socket.disconnect();
    console.log(`❌ socket ${socket.id} disconnected`);

    socket.emit("onlineAdmins", onlineAdmins);
    //socket.emit("onlineUsers", onlineUsers)
    // console.log(" 📻 ONLINE USERS: ", onlineUsers);
    console.log(" 📻 👨‍💻 ONLINE ADMINS 3: ", onlineAdmins);
  }
});

mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("👌 Connected to Mongo!");

  httpServer.listen(port, () => {
    console.table(listEndpoints(app));
    console.log(`🟢 Server listening on port ${port} 🚀 `);
  });
});
