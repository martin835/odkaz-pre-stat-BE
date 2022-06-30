import cors from "cors";
import express from "express";
import passport from "passport";
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
import googleStrategy from "./auth/OAuth.js";
import basicReviewCommentsRouter from "./services/routers/basicReviewComments-router.js";
import chatRouter from "./services/routers/chat-router.js";

const app = express();

//***********************************Middlewares*******************************************************/
passport.use("google", googleStrategy);

const whitelist = [
  process.env.FE_DEV_URL,
  process.env.FE_PROD_URL,
  process.env.REDIRECT,
];

app.use(
  cors({
    origin: function (origin, next) {
      //cors is a global middleware - for each request
      //console.log("ORIGIN: ", origin);
      // 0 \\ 0
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        //console.log("ORIGIN ALLOWED");
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
app.use(passport.initialize());

//***********************************Endpoints*********************************************************/

app.use("/services", servicesRouter);
app.use("/users", usersRouter);
app.use("/chats", chatRouter);
app.use("/clientCenters", clientCenterRouter);
app.use("/reviews", [basicReviewRouter, basicReviewCommentsRouter]);

// For test purposes

app.get("/test", (req, res) => {
  res.send({ message: "Hello, World!" });
});

//***********************************Error handlers****************************************************/

app.use(badRequestHandler);
app.use(unauthorizedHandler);
app.use(forbiddenHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

export default app;
