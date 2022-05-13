import express from "express";
import createError from "http-errors";
import ServiceModel from "../models/service-model.js";
import BasicReviewModel from "../models/basicReview-model.js";
import ClientCenterModel from "../models/clientCenter-model.js";

const servicesRouter = express.Router();

servicesRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const services = await ServiceModel.find({})
      .populate({
        path: "reviews",
      })
      .populate({
        path: "provider",
        select: "name district url",
      });
    res.send(services);
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const newService = new ServiceModel(req.body);
    const { _id } = await newService.save();

    const clientCenterToAddServiceTo =
      await ClientCenterModel.findByIdAndUpdate(
        { _id: req.body.provider },
        { $push: { services: _id } },
        { new: true }
      );
    console.log("SERVICE ADDED TO KC: ", clientCenterToAddServiceTo);

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

servicesRouter.get("/:id", async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const service = await ServiceModel.findById(req.params.id).populate({
      path: "reviews",
    });

    if (service) {
      res.send(service);
    } else {
      next(createError(404, `CK with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default servicesRouter;
