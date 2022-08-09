import express from "express";
import createError from "http-errors";
import ProviderModel from "../models/provider-model.js";
//import ServiceModel from "../models/service-model.js";

const providerRouter = express.Router();

providerRouter.get("/", async (req, res, next) => {
  try {
    const providers = await ProviderModel.find({}).populate({
      path: "services",
    });

    res.send(providers);
  } catch (error) {
    next(error);
  }
});

providerRouter.post("/", async (req, res, next) => {
  try {
    const newProvider = new ProviderModel(req.body);
    const { _id } = await newProvider.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

providerRouter.get("/:id", async (req, res, next) => {
  try {
    const provider = await ProviderModel.findById(req.params.id).populate({
      path: "services",
    });

    if (provider) {
      res.send(provider);
    } else {
      next(createError(404, `CK with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default providerRouter;
