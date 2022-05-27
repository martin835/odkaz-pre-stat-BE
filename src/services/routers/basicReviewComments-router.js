import express from "express";
import createError from "http-errors";
import q2m from "query-to-mongo";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import BasicReviewModel from "../models/basicReview-model.js";

const basicReviewCommentsRouter = express.Router();

//6  POST a COMMENT to a review
basicReviewCommentsRouter.post(
  "/:reviewId/comments",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("➡️ PING - POST a COMMENT REQUEST");

      const newComment = {
        ...req.body,
        commentDate: new Date(),
      };

      const review = await BasicReviewModel.findByIdAndUpdate(
        req.params.reviewId,
        { $push: { comments: newComment } },
        { new: true, runValidators: true }
      );

      if (review) {
        res.send(review);
      } else {
        next(
          createError(
            404,
            `Review post with id ${req.params.reviewId} not found!`
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
);

//7 GET COMMENTS for  a Review
basicReviewCommentsRouter.get("/:reviewId/comments", async (req, res, next) => {
  try {
    console.log("➡️ PING - GET ALL COMMENTs REQUEST");

    const reviewComments = await BasicReviewModel.findById(req.params.reviewId);
    if (reviewComments) {
      res.send(reviewComments.comments);
    } else {
      next(
        createError(
          404,
          `Review post with id ${req.params.reviewId} not found!`
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//8 GET ONE COMMENT from a Review
basicReviewCommentsRouter.get(
  "/:reviewId/comments/:commentId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("➡️ PING - GET a COMMENT REQUEST");

      const review = await BasicReviewModel.findById(req.params.reviewId);
      if (review) {
        const comment = review.comments.find(
          (comment) => comment._id.toString() === req.params.commentId
        );

        if (comment) {
          res.send(comment);
        } else {
          next(
            createError(
              404,
              `Comment with id ${req.params.commentId} not found!`
            )
          );
        }
      } else {
        next(
          createError(
            404,
            `Review post with id ${req.params.reviewId} not found!`
          )
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
//9 EDIT a COMMENT in a Review
basicReviewCommentsRouter.put(
  "/:reviewId/comments/:commentId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("➡️ PING - EDIT a COMMENT REQUEST");

      const review = await BasicReviewModel.findById(req.params.reviewId);
      if (review) {
        const index = review.comments.findIndex(
          (comment) => comment._id.toString() === req.params.commentId
        );
        if (index !== -1) {
          review.comments[index] = {
            ...review.comments[index].toObject(),
            ...req.body,
          };

          await review.save();

          res.send(review);
        } else {
          next(
            createError(
              404,
              `Comment with id ${req.params.commentId} not found!`
            )
          );
        }
      } else {
        next(
          createError(
            404,
            `Review post with id ${req.params.reviewId} not found!`
          )
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
//10 DELETE A COMMENT in a Review
basicReviewCommentsRouter.delete(
  "/:reviewId/comments/:commentId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("➡️ PING - DELETE a COMMENT REQUEST");

      const modifiedReview = await BasicReviewModel.findByIdAndUpdate(
        req.params.reviewId, //what
        { $pull: { comments: { _id: req.params.commentId } } }, //how
        { new: true } //options
      );
      if (modifiedReview) {
        res.send(modifiedReview);
      } else {
        next(
          createError(
            404,
            `Review post with id ${req.params.reviewId} not found!`
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
);

export default basicReviewCommentsRouter;
