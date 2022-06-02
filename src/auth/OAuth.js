import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import UsersModel from "../services/models/user-model.js";
import { generateAccessToken } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/users/googleRedirect`,
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    //console.log("PROFILE: ", profile);

    try {
      // this callback is executed when Google sends us a successfull response back (through the redirect url)
      // here we are receiving some informations about the user from Google (scopes --> profile, email)

      // 1. Check if user is already in our db

      const user = await UsersModel.findOne({ email: profile.emails[0].value });

      if (user) {
        console.log("User exists!");
        // 2. If user is there --> generate an accessToken for him/her
        const accessToken = await generateAccessToken({
          _id: user._id,
          role: user.role,
        });

        // 3. We go next (we go to the route handler --> /users/googleRedirect)
        passportNext(null, { token: accessToken });
      } else {
        // 4. Else if user is not in db --> add user to db and then create token for him/her.
        const newUser = new UsersModel({
          name: profile.name.givenName,
          surname: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0].value,
        });

        const savedUser = await newUser.save();
        const accessToken = await generateAccessToken({
          _id: savedUser._id,
          role: savedUser.role,
        });

        // 5. We go next
        passportNext(null, { token: accessToken });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

// If you get the "Failed to serialize user into session" error, you have to add the following code

passport.serializeUser((data, passportNext) => {
  passportNext(null, data);
});

export default googleStrategy;
