const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const nodeMailer = require("nodemailer");


// JWT
const jwt = require("../middleware/jwt.js");
const simplejwt = require("jsonwebtoken");

//General Helper
const GeneralHelper = require("../shared/GeneralHelper.js");

// Middlewares
const checkCreateParams = require("./requests/create.js");
const checkPasswordParams = require("./requests/password.js");
// Mail
const { sendEmail } = require("../shared/mail.service.js");

// Models
const User = require("../user/user.model.js");
const TwoFactorAuth = require("./auth.model.js");

// Servivces
const UserService = require("../user/user.service.js");
const LogService= require("../log/log.service.js")
const OrganizationService = require("../organization/organization.service.js");

// Response Helpers
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");

//SignUp
router.post("/signup", checkCreateParams, async (req, res, next) => {
  const {name, email, password, role}=req.body;
  try {
    console.log(req.body);
    // Check if user with the provided email already exists
    const existingUser = await User.findOne( { $or :[{email:email}] });
    if (existingUser) {
      if(existingUser.email === email){
        return res.status(400).send({ error: true, msg: "Email  already registered" });
      }else{
        return res.status(400).send({ error: true, msg: "Cnic Number  already registered" });
      }
    }
    // Create a new user
    const newUser = await UserService.create(name, email,password,role);

    // Return success response
    return sendSuccessResponse(res, "User created successfully", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    // Return error response
    return sendErrorResponse(
      res,
      `Failed to create user: ${error.message}`
    );
  }
});


// Login
router.post("/login", async (req, res, next) => {
  let request = req.body;

  if (!request.email) return sendErrorResponse(res, "Missing Parameters!");

  let user = await UserService.findByEmail(request.email);

  if (user == null) return sendErrorResponse(res, "User Does not exist!");

  let matched = await GeneralHelper.comparePassword(
    request.password,
    user.password
  );

  if (!matched) return sendErrorResponse(res, "Invalid Password!");

  let data = {
    email: user.email,
    userId: user._id,
    role:user.role,
    user
  };

  let optional = {};

  if (!request.rememberMe) optional["expiresIn"] = "24h";

  const token = simplejwt.sign(data, process.env.JWT_SECRET, optional);

  let result = {
    _id: user._id,
    email: user.email,
    token: token,
    role:user.role,
    user
  };
  let text="User logged in"
  let createdBy=user._id
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Login Successful", result);
});

// Request Code
router.post("/requestCode", async (req, res, next) => {
  try {
    let request = req.body;

    if (!request.email || !request.password) {
      return sendErrorResponse(res, "Missing email or password");
    }

    let user = await UserService.findByEmail(request.email);

    if (!user) {
      return sendErrorResponse(res, "Email does not exist");
    }

    // Verify password
    let matched = await GeneralHelper.comparePassword(
      request.password,
      user.password
    );

    if (!matched) return sendErrorResponse(res, "Invalid Password!");

    // Generate OTP
    const otp = GeneralHelper.getOtp();

    // Store OTP and expiration time in the AuthModel
    const authData = new TwoFactorAuth({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      email: user.email,
      authCode: otp.code,
      status: false, // Initial status
      expiration: otp.expiration,
    });
    await authData.save();

    sendOTP(user, otp);
    let text="OTP sent to your email"
  let createdBy=user._id
  let log = await LogService.create(text,createdBy);
    // Return success response with user data and JWT token
    return sendSuccessResponse(res, "OTP sent to your email", {
      userId: user._id,
      data: authData,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return sendErrorResponse(res, "Internal server error");
  }
});

// Forgot Password   Send Code
router.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ error: true, message: "Email is empty" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ error: true, message: "User does not exist" });
    }

    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "smart.job.seekerr@gmail.com",
         pass: "lzhtpowswlbktkgt"
       }
      // auth: {
      //   user: "talhaarif.qwertyexperts@gmail.com",
      //   pass: "qznamaurcrakfcul"
      // }
    });

    const code = Math.floor(100000 + Math.random() * 900000);

    let result = await transporter.sendMail({
      from: "smart.job.seekerr@gmail.com",
      to: email,
      subject: "Verification Code from Talha",
      text: "Your Verification Code is: " + code
    });

    if (result) {
      let updateResult = await User.updateOne(
        { email: email }, 
        { resetToken: code, resetTokenExpiration: Date.now() +3600000 });
      if (updateResult.modifiedCount > 0)
        return res.status(200).send({ error: false, msg: "Code sent successfully" });
    }

    // If email sending failed or user update failed
    return res.status(500).send({ error: true, msg: "Failed to send code" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).send({ error: true, msg: error.message || "Internal server error" });
  }
});

//Verify Code
router.post("/verifyCode",async(req, res, next) => {
  try{
    const{ otp, email } =req.body;

    if(!email)
        return res.status(201).send({error: true, msg: "Enter email address"});
    if(!otp)
        return res.status(201).send({error: true, msg: "OTP is empty"});

    let user = await User.findOne({email: email}).catch(err => console.log(err));
    if(user){
        let givenTime = new Date(user.resetTokenExpiration).getTime();
        if(Date.now() < givenTime+(60*60*1000)){
            if(user.resetToken===otp){
                await User.updateOne({email: email}, {resetToken:'', resetTokenExpiration: null}).catch(err => console.log(err));
                return res.status(200).send({error: false, msg: "OTP matched successfully"});
            }else
                return res.status(201).send({error: true, msg: "OTP not matched"});
        }else
            return res.status(201).send({error: true, msg: "OTP Expired. Refresh and try again"});
  }
}
  catch(err) {
    console.log(err);
    res.status(500).json({message:"Internal server error", err})
  }
})

// Reset Password  New Password
router.post("/resetPassword", async (req, res) => {
  try {
    // const { email,  password, confirmPassword } = req.body;
    const { email,  password } = req.body;

    console.log("email: ", email);
    let modifiedEmail=email.trim().toLowerCase();
    // Check if email exists
    const user = await User.findOne({ email:modifiedEmail });
    if (!user) return sendErrorResponse(res, "User not found!");
    
    console.log("after1: ", modifiedEmail);

    // Check if reset code matches
    // if (user.resetToken !== code) return sendErrorResponse(res, "Invalid Code");

    // Check if password and confirm password match
    // if (password !== confirmPassword)
    //   return sendErrorResponse(res, "Confirm Password does not match");

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Clear reset token and code
    user.resetToken = null;

    // Save the updated user
    await user.save();
    return sendSuccessResponse(res, "Password reset successfully");
  } catch (error) {
    return sendErrorResponse(res, "Internal server error");
  }
});

// Change Password
router.post("/changePassword", jwt, checkPasswordParams, async (req, res) => {
  try {
    let userId=req.user.userId;
    const {  currentPassword, newPassword, confirmNewPassword } = req.body;

    // Check if all required fields are provided
    if (!currentPassword || !newPassword || !confirmNewPassword)
      return sendErrorResponse(res, "Missing required fields!");

    // Check if new password matches confirm new password
    if (newPassword !== confirmNewPassword)
      return sendErrorResponse(res, "Confirm password does not match!");

    const user = await User.findById(userId);

    // Check if user exists
    if (!user) return sendErrorResponse(res, "User not found!");

    // Check if old password matches the current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid)
      return sendErrorResponse(res, "Invalid old password!");

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password with the new hashed password
    user.password = hashedNewPassword;
    await user.save();

    // Password changed successfully
        let text="Password changed successfully"
  let createdBy=user._id
  let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Password changed successfully");
  } catch (error) {
    return sendErrorResponse(res, "Internal server error");
  }
});


//List of Users

router.get("/users-list", async (req, res) => {
  try {
    let users = await User.find();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    console.log(users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function sendOTP(user, otp) {
  // const link = `http://${process.env.FRONT_BASE_URL}/reset-password/${resetToken}`;

  const replacements = {
    code: otp.code,
    expiration: otp.expiration,
    name: user.name,
  };
  template = __dirname + "\\mails\\otp.html";
  sendEmail("OTP", template, user.email, replacements);
}

async function sendForgotLink(user, resetToken) {
  const link = `http://${process.env.FRONT_BASE_URL}/reset-password/${resetToken}`;
  const replacements = {
    link: link,
    name: user.name,
  };
  template = __dirname + "\\mails\\forgot.html";
  sendEmail("Reset Your Password", template, user.email, replacements);
}

module.exports = router;
