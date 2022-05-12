import express from "express";
import createError from "http-errors";
import UserModel from "../models/user-model.js";

const usersRouter = express.Router();

usersRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const users = await UserModel.find({}).populate({ path: "reviews" });

    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default usersRouter;
