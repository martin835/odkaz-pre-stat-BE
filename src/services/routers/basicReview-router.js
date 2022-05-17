import express from "express";
import createError from "http-errors";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import BasicReviewModel from "../models/basicReview-model.js";
import serviceModel from "../models/service-model.js";

const basicReviewRouter = express.Router();

basicReviewRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const reviews = await BasicReviewModel.find({});

    res.send(reviews);
  } catch (error) {
    next(error);
  }
});

basicReviewRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const newReview = new BasicReviewModel({ ...req.body, user: req.user._id });
    const { _id } = await newReview.save();

    const serviceToReview = await serviceModel.findByIdAndUpdate(
      { _id: req.body.service },
      { $push: { reviews: _id } },
      { new: true }
    );
    console.log(serviceToReview);

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default basicReviewRouter;
