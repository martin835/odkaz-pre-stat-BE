import express from "express";
import createError from "http-errors";
import ClientCenterModel from "../models/clientCenter-model.js";

const clientCenterRouter = express.Router();

clientCenterRouter.get("/", async (req, res, next) => {
  console.log("📨 PING - GET REQUEST");
  try {
    const clientCenters = await ClientCenterModel.find({});

    res.send(clientCenters);
  } catch (error) {
    next(error);
  }
});

clientCenterRouter.post("/", async (req, res, next) => {
  console.log("📨 PING - POST REQUEST");
  try {
    const newClientCenter = new ClientCenterModel(req.body);
    const { _id } = await newClientCenter.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

export default clientCenterRouter;
