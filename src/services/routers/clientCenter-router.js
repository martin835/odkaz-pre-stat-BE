import express from "express";
import createError from "http-errors";
import ClientCenterModel from "../models/clientCenter-model.js";
//import ServiceModel from "../models/service-model.js";

const clientCenterRouter = express.Router();

clientCenterRouter.get("/", async (req, res, next) => {
  //console.log("📨 PING - GET REQUEST");
  try {
    const clientCenters = await ClientCenterModel.find({}).populate({
      path: "services",
    });

    res.send(clientCenters);
  } catch (error) {
    next(error);
  }
});

clientCenterRouter.post("/", async (req, res, next) => {
  //console.log("📨 PING - POST REQUEST");
  try {
    const newClientCenter = new ClientCenterModel(req.body);
    const { _id } = await newClientCenter.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

clientCenterRouter.get("/:id", async (req, res, next) => {
  //console.log("📨 PING - GET CLIENTCENTER/ID REQUEST");
  try {
    const clientCenter = await ClientCenterModel.findById(
      req.params.id
    ).populate({ path: "services" });

    if (clientCenter) {
      res.send(clientCenter);
    } else {
      next(createError(404, `CK with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default clientCenterRouter;
