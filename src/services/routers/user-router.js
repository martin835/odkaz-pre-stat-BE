import express from "express";
import createError from "http-errors";
import passport from "passport";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import UserModel from "../models/user-model.js";
import googleStrategy from "../../auth/OAuth.js";
import { generateAccessToken } from "../../auth/tools.js";
import { sendRegistrationEmail } from "../../tools/email-tools.js";

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

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      res.send(user);
    } else {
      next(createError(401, `User with id ${req.user._id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  console.log(req.body);
  try {
    //1. Obtain credentials from req.body
    const { email, password } = req.body;

    //2. Verify credentials
    const user = await UserModel.checkCredentials(email, password);
    console.log(user);
    if (user) {
      const accessToken = await generateAccessToken({
        _id: user._id,
        role: user.role,
      });
      res.send({ accessToken });
    } else {
      next(createError(401, `Wrong login / registration credentials!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  console.log(req.body);
  try {
    const { email, name } = req.body;

    const body = {
      email: email,
      name: name,
      link: `http://potvrdzovacilink`,
    };

    await sendRegistrationEmail(body);

    res.send();
  } catch (error) {
    next(error);
  }
});

usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      console.log("Token: ", req.user.token);
      //res.send({ accessToken: req.user.token });
      res.redirect(`${process.env.FE_DEV_URL}?accessToken=${req.user.token}`);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/:id", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const user = await UserModel.findById({ _id: req.params.id });

    res.send(user);
  } catch (error) {
    next(error);
  }
});

export default usersRouter;
