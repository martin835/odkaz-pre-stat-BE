import axios from "axios";

const validateHuman = async (token) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const response = await axios(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: "POST" }
  );

  const data = await response.data;

  console.log("recaptcha data: ", data);

  return data.success;
};

export default validateHuman;
