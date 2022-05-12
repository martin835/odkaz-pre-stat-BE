import cors from "cors";
import express from "express";
import {
  badRequestHandler,
  forbiddenHandler,
  genericErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers.js";
import basicReviewRouter from "./services/routers/basicReview-router.js";
import clientCenterRouter from "./services/routers/clientCenter-router.js";
import servicesRouter from "./services/routers/service-router.js";
import usersRouter from "./services/routers/user-router.js";

const app = express();
const whitelist = [
  process.env.FE_DEV_URL,
  process.env.FE_PROD_URL,
  process.env.REDIRECT,
];

app.use(
  cors({
    origin: function (origin, next) {
      //cors is a global middleware - for each request
      console.log("ORIGIN: ", origin);
      // 0 \\ 0
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        console.log("ORIGIN ALLOWED");
        next(null, true);
      } else {
        console.log("ORIGIN NOT ALLOWED");
        next(new Error("CORS ERROR!"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes

app.use("/services", servicesRouter);
app.use("/users", usersRouter);
app.use("/clientCenters", clientCenterRouter);
app.use("/reviews", basicReviewRouter);

// For test purposes

app.get("/test", (req, res) => {
  res.send({ message: "Hello, World!" });
});

// Error handlers

app.use(badRequestHandler);
app.use(unauthorizedHandler);
app.use(forbiddenHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

export default app;
