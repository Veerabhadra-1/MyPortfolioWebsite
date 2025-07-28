const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const path = require("path");

// dotenv configuration
dotenv.config();

// rest object
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

//static files
app.use(express.static(path.join(__dirname, "./client/build")));

// routes
app.use("/api/v1/portfolio", require("./routes/portfolioRoute"));

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Gmail OAuth2 setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Email sending route with fixed recipient
app.post("/api/v1/send-email", async (req, res) => {
  const { subject, text } = req.body;

  if (!subject || !text) {
    return res
      .status(400)
      .send({
        success: false,
        message: "Missing 'subject' or 'text' in request body",
      });
  }

  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;

    if (!accessToken) {
      return res
        .status(500)
        .send({ success: false, message: "Failed to get access token" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // Fixed recipient email
    const mailOptions = {
      from: `Your App <${process.env.EMAIL}>`,
      to: "yamalaveerabhadrarao@gmail.com",
      subject,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    res.status(200).send({ success: true, message: "Email sent", result });
  } catch (error) {
    console.error("Email Error:", error);
    res
      .status(500)
      .send({ success: false, message: "Email failed", error: error.message });
  }
});

// port
const PORT = process.env.PORT || 8080;

// listen
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
