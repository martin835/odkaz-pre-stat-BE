import express from "express";
import createError from "http-errors";
import ServiceModel from "../models/service-model.js";

const servicesRouter = express.Router();

servicesRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const services = await ServiceModel.find({}).populate({
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
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default servicesRouter;
