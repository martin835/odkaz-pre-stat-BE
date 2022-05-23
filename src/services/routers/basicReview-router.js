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
    const reviews = await BasicReviewModel.find(
      mongoQuery.criteria.clientCenterId
        ? {
            provider: mongoQuery.criteria.clientCenterId,
          }
        : {}
    )
      .limit(mongoQuery.options.limit || 6)
      .skip(mongoQuery.options.skip || 0)
      .sort({ createdAt: -1 })
      .populate({ path: "user" })
      .populate({ path: "service" });

    //if request is for specific client center calculate average rating based on available reviews.

    if (mongoQuery.criteria.clientCenterId) {
      const reviewsToCalcStats = await BasicReviewModel.find({
        provider: mongoQuery.criteria.clientCenterId,
      });

      let sumOfAllReviews = 0;
      for (let i = 0; i < reviewsToCalcStats.length; i++) {
        sumOfAllReviews += reviewsToCalcStats[i].rating;
      }

      let weight5 =
        (reviewsToCalcStats.filter((review) => review.rating === 5).length /
          reviewsToCalcStats.length) *
        100;
      let weight4 =
        (reviewsToCalcStats.filter((review) => review.rating === 4).length /
          reviewsToCalcStats.length) *
        100;
      let weight3 =
        (reviewsToCalcStats.filter((review) => review.rating === 3).length /
          reviewsToCalcStats.length) *
        100;
      let weight2 =
        (reviewsToCalcStats.filter((review) => review.rating === 2).length /
          reviewsToCalcStats.length) *
        100;
      let weight1 =
        (reviewsToCalcStats.filter((review) => review.rating === 1).length /
          reviewsToCalcStats.length) *
        100;

      console.log("weights: ", {
        weight5: weight5,
        weight4: weight4,
        weight3: weight3,
        weight2: weight2,
        weight1: weight1,
      });
      let avgRating =
        Math.round((sumOfAllReviews / reviewsToCalcStats.length) * 10) / 10;
      console.log(
        "AVERAGE RATING: ",
        sumOfAllReviews / reviewsToCalcStats.length
      );

      res.send({
        avgRating: avgRating,
        reviewsCount: reviewsToCalcStats.length,
        weights: {
          weight5: weight5,
          weight4: weight4,
          weight3: weight3,
          weight2: weight2,
          weight1: weight1,
        },
        reviews: reviews,
      });
    } else {
      res.send(reviews);
    }
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
