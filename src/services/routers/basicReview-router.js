import express from "express";
import q2m from "query-to-mongo";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import BasicReviewModel from "../models/basicReview-model.js";
import serviceModel from "../models/service-model.js";

const basicReviewRouter = express.Router();

basicReviewRouter.get("/", async (req, res, next) => {
  // console.log("📨 PING - GET REQUEST");
  // console.log("REQ QUERY: ", req.query);
  // console.log("QUERY-TO-MONGO: ", q2m(req.query));
  try {
    const mongoQuery = q2m(req.query);
    const reviews = await BasicReviewModel.find(mongoQuery.criteria)
      .limit(mongoQuery.options.limit || 6)
      .skip(mongoQuery.options.skip || 0)
      .sort({ createdAt: -1 })
      .populate({ path: "user" })
      .populate({ path: "service" });

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
