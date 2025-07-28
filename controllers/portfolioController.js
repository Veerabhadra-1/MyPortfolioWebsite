const { google } = require("googleapis");
const nodemailer = require("nodemailer");
require("dotenv").config();

// OAuth2 client setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const sendEmailController = async (req, res) => {
  try {
    const { name, email, msg } = req.body;

    // validation
    if (!name || !email || !msg) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    // get access token
    const accessToken = await oAuth2Client.getAccessToken();

    // create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // email options
    const mailOptions = {
      from: `Portfolio App <${process.env.EMAIL}>`,
      to: "yamalaveerabhadrarao@gmail.com",  // fixed recipient address
      subject: "Regarding Portfolio App",
      html: `<h5>Detail Information</h5>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Message:</strong> ${msg}</li>
        </ul>`,
    };

    // send email
    const result = await transporter.sendMail(mailOptions);

    return res.status(200).send({
      success: true,
      message: "Your message sent successfully",
      result,
    });
  } catch (error) {
    console.error("Send Email API Error:", error);
    return res.status(500).send({
      success: false,
      message: "Send Email API Error",
      error,
    });
  }
};

module.exports = { sendEmailController };
