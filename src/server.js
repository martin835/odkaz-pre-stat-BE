import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import app from "./app.js";

const port = process.env.PORT || 3001;

if (!process.env.MONGO_CONNECTION) {
  throw new Error("No Mongo url");
}

mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("👌 Connected to Mongo!");

  app.listen(port, () => {
    console.table(listEndpoints(app));
    console.log(`🚀 Server listening on port ${port}`);
  });
});
