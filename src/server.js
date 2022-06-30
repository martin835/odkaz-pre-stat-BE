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

      //for admins, I want to broadcast their socker, so user can send them PM, when they don't have a chat yet (first time when chat is created).
      //for users I don't do this, because admin cannot send first PM to a user
      //const adminToPush = { ...user.toObject(), adminSocketID: socket.id };
      //console.log("ADMIN TO PUSH: ", adminToPush);

      if (
        //This condition is filtering out duplicates from array which are probably created because of multiple sockets coming from frontend
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
        //This condition is filtering out duplicates from array which are probably created because of multiple sockets coming from frontend
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

    //console.log(" 📻 👤 ONLINE USERS 1: ", onlineUsers);
    //console.log(" 📻 👨‍💻 ONLINE ADMINS 1: ", onlineAdmins);
    socket.broadcast.emit("onlineAdmins", onlineAdmins);
    socket.broadcast.emit("onlineUsers", onlineUsers);

    //JOINING CHATS START 💬💬💬

    // grabbing chats for this user....
    const userChats = await ChatModel.find({
      members: { $all: [payload._id] },
    });
    // console.log(
    //   ` 👩‍👩‍👧‍👧THESE ARE CHATS THIS USER ${payload.username} IS MEMBER OF: `,
    //   userChats
    // );

    const chats = userChats.map((chat) => chat._id.toString());
    console.log("THIS IS ARRAY WITH CHAT IDs TO JOIN: ", chats);
    socket.join(chats);
    socket.join(payload._id);

    console.log("JOINED CHATS: ", socket.rooms);

    //JOINING CHATS END 💬💬💬

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

    //Updating onlineAdmins ⚠️ ⚠️ ⚠️-- uncecessary - needs refactor 0 = removing, 1 = adding
    socket.on("updatedOnlineAdmins", async (addingOrRemoving, adminId) => {
      if (addingOrRemoving === 0) {
        console.log("ADMIN ID TO KICK OUT: ", adminId);
        onlineAdmins = onlineAdmins.filter(
          (admin) => admin._id.toString() !== adminId
        );
        console.log("DID I HAPPENED?", onlineAdmins);
        socket.broadcast.emit("onlineAdmins", onlineAdmins);
        //⚠️ ⚠️ ⚠️  This whole piece with adding 1 / removing 0 is not needed,  on logging in I am broadcasting all online admins / users ....
      } else if (addingOrRemoving === 1) {
        const user = await UserModel.findById(
          { _id: adminId },
          "_id avatar name"
        );
        console.log("ADMIN ID TO ADD: ", user);
        onlineAdmins.push(user);
        console.log("DID I HAPPENED?", onlineAdmins);
        socket.broadcast.emit("onlineAdmins", onlineAdmins);
      }
    });

    //Updating onlineAdmins ⚠️ ⚠️ ⚠️-- uncecessary - n

    socket.on("updatedOnlineUsers", async (addingOrRemoving, userId) => {
      if (addingOrRemoving === 0) {
        console.log("USER ID TO KICK OUT: ", userId);
        onlineUsers = onlineUsers.filter(
          (user) => user._id.toString() !== userId
        );
        console.log("DID I HAPPENED?", onlineUsers);
        socket.broadcast.emit("onlineUsers", onlineUsers);
        //⚠️ ⚠️ ⚠️  This whole piece with adding 1 / removing 0 is not needed,  on logging in I am broadcasting all online admins / users ....
      } else if (addingOrRemoving === 1) {
        const user = await UserModel.findById(
          { _id: userId },
          "_id avatar name"
        );
        console.log("USER ID TO ADD: ", user);
        onlineAdmins.push(user);
        console.log("DID I HAPPENED?", onlineUsers);
        socket.broadcast.emit("onlineAdmins", onlineUsers);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.id} disconnected`);
      onlineUsers = onlineUsers.filter(
        (user) => user._id.toString() !== payload._id
      );
      onlineAdmins = onlineAdmins.filter(
        (admin) => admin._id.toString() !== payload._id
      );
      socket.broadcast.emit("onlineAdmins", onlineAdmins);
      socket.broadcast.emit("onlineUsers", onlineUsers);
      console.log(" 📻 ONLINE USERS 2: ", onlineUsers);
      //console.log(" 📻 👨‍💻 ONLINE ADMINS 2: ", onlineAdmins);
    });
  } else if (!socket.handshake.auth.token) {
    socket.disconnect();
    console.log(`❌ socket ${socket.id} disconnected`);
    //socket.emit("onlineAdmins", onlineAdmins);
    //socket.emit("onlineUsers", onlineUsers)
    console.log(" 📻 ONLINE USERS 3: ", onlineUsers);
    //console.log(" 📻 👨‍💻 ONLINE ADMINS 3: ", onlineAdmins);
  }
  //console.log(" 📻 👨‍💻 ONLINE ADMINS 4: ", onlineAdmins);
});

mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("👌 Connected to Mongo!");

  httpServer.listen(port, () => {
    console.table(listEndpoints(app));
    console.log(`🟢 Server listening on port ${port} 🚀 `);
  });
});
