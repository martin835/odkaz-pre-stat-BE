import express from "express";
import q2m from "query-to-mongo";
import createError from "http-errors";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import BasicReviewModel from "../models/basicReview-model.js";
import UsersModel from "../models/user-model.js";
import serviceModel from "../models/service-model.js";

const basicReviewRouter = express.Router();

//1. Get all Reviews in the DB
basicReviewRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  console.log("REQ QUERY: ", req.query);
  console.log("QUERY-TO-MONGO: ", q2m(req.query));
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

      let avgRating =
        Math.round((sumOfAllReviews / reviewsToCalcStats.length) * 10) / 10;
      // console.log(
      //   "AVERAGE RATING: ",
      //   sumOfAllReviews / reviewsToCalcStats.length
      // );

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

//2. Posts new review into the DB
basicReviewRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  //console.log("📨 PING - POST REQUEST");
  try {
    const newReview = new BasicReviewModel({ ...req.body, user: req.user._id });
    const { _id } = await newReview.save();

    const serviceToReview = await serviceModel.findByIdAndUpdate(
      { _id: req.body.service },
      { $push: { reviews: _id } },
      { new: true }
    );
    //console.log(serviceToReview);

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//3. Get stats about reviews
basicReviewRouter.get("/stats", async (req, res, next) => {
  //console.log("📨 PING - GET STATS REQUEST");
  try {
    //get  all reviews
    const mongoQuery = q2m(req.query);
    const averageRatingPerClientCenter = await BasicReviewModel.aggregate([
      {
        $group: {
          _id: "$provider",
          avgRating: { $avg: "$rating" },
          noReviews: { $count: {} },
        },
      },
    ])
      .lookup({
        from: "clientcenters",
        localField: "_id",
        foreignField: "_id",
        as: "Provider",
      })
      .limit(mongoQuery.options.limit || 10);

    //console.log(averageRatingPerClientCenter);
    res.send(averageRatingPerClientCenter);
  } catch (error) {
    next(error);
  }
});

//4. Get a specific review with reviewId

basicReviewRouter.get("/:reviewId", async (req, res, next) => {
  try {
    //console.log(`➡️ PING - GET Review with ${req.params.reviewId}  REQUEST`);

    const review = await BasicReviewModel.findById(req.params.reviewId);
    if (review) {
      res.send(review);
    } else {
      next(
        createError(404, `Review  with id ${req.params.reviewId} not found :(`)
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//5. Post a like to a specific review
basicReviewRouter.post(
  "/:reviewId/likes",
  JWTAuthMiddleware,
  async (req, res, next) => {
    //console.log(`👍 PING - LIKE REQUEST for review ${req.params.reviewId}`);
    try {
      const { userId } = req.body;

      // 0. Does review post exist?

      const review = await BasicReviewModel.findById(req.params.reviewId);
      if (!review)
        return next(
          createError(404, `Review with id ${req.params.reviewId} not found`)
        );

      // 1. Does user exist?

      const user = await UsersModel.findById(userId);
      if (!user)
        return next(createError(404, `User with id ${userId} not found`));

      // 2. Is the blog post already liked by specified userId?
      const isReviewLiked = await BasicReviewModel.findOne({
        _id: req.params.reviewId,
        "likes.userId": user._id,
      });

      if (isReviewLiked) {
        // 3.1 If it is there --> remove like

        const modifiedLikes = await BasicReviewModel.findOneAndUpdate(
          {
            _id: req.params.reviewId,
          },
          {
            $pull: { likes: { userId: userId } }, // in JS --> find index of the element --> products[index].quantity += quantity
          },
          {
            new: true,
          }
        );
        res.send(modifiedLikes);
      } else {
        // 3.2 If it is not --> add like
        const modifiedLikes = await BasicReviewModel.findOneAndUpdate(
          { _id: req.params.reviewId }, // WHAT we want to modify
          { $push: { likes: { userId: user._id } } }, // HOW we want to modify the record
          {
            new: true, // OPTIONS
            upsert: true, // if the like of that blog post is not found --> just create it automagically please
          }
        );
        res.send(modifiedLikes);
      }
    } catch (error) {
      next(error);
    }
  }
);

export default basicReviewRouter;
