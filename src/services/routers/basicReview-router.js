import express from "express";
import createError from "http-errors";
import BasicReviewModel from "../models/basicReview-model.js";

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

basicReviewRouter.post("/", async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const newReview = new BasicReviewModel(req.body);
    const { _id } = await newReview.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default basicReviewRouter;
