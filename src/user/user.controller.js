const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const PDFDocument = require("pdfkit");
const User =require("./user.model.js");
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');
const pdf = require('html-pdf');
const nodeMailer= require('nodemailer');
// Middlewares
const jwt = require("../middleware/jwt.js");
const upload= require("./user.service.js")

// Services
const UserService = require("./user.service");
const LogService = require("../log/log.service.js")
//Helpers
const GeneralHelper = require("../shared/GeneralHelper.js");

// Validations
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update.js");
const checkProfileParams = require("./requests/updateProfile.js")

// Response Helpers
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");
const { log } = require("console");


// Job Seeker List
router.get("/jobSeekerList", async (req, res, next) => {
  try {
    const users = await User.find({ role: '3' });
    
    if (users.length === 0) {
      return res.status(404).json({ message: "Job Seeker not found" });
    }

    // Respond with the list of job seekers
    res.status(200).json({ message: "Job Seekers are:", users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Companies List
router.get("/companyList", async (req, res, next) => {
  try {
    const users = await User.find({ role: '2' });
    
    if (users.length === 0) {
      return res.status(404).json({ message: "Companies not found" });
    }

    // Respond with the list of job seekers
    res.status(200).json({ message: "Companies are:", users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//Update User Profile
router.post("/updateUserProfile", jwt, UserService.upload.single('profilePicture'),async (req, res, next) => {
  try {
    let userId = req.user.userId;
    // Find the user by userId
    let user = await UserService.findById({_id:userId});
    console.log("before",user)
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    console.log(req.body);
    // Update the user profile
    let updateUser=await UserService.update({userId}, req.body);
    console.log(req.body);
    console.log(updateUser)
    
    let profileStatus = await UserService.update({userId},{profileStatus: true})
    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//User Profile
router.post("/updateUserProfile", jwt, UserService.upload.single('profilePicture'), async (req, res, next) => {
  try {
    let userId = req.user.userId;

    // Find the user by userId
    let user = await UserService.findById({_id: userId});
    if (!user) {
      return res.status(404).send({ message: "User not found Talha" });
    }
    let updatedData = { ...user._doc }; 

    if (req.file) {
      updatedData.profilePicture = req.file.path;
    }
    updatedData = { ...updatedData, ...req.body };

    let updateUser = await UserService.update({ _id: userId }, updatedData);

    // Update profileStatus to true
    let profileStatus = await UserService.update({ _id: userId }, { profileStatus: true });

    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//COmpany Profile update
router.post("/updateCompanyProfile", jwt, UserService.upload.single('profilePicture'), async (req, res, next) => {
  console.log("Route hit: /updateCompanyProfile");
  try {
    let userId = req.user.userId;
    
    let user = await UserService.findById({_id: userId});
    if (!user) {
      return res.status(404).send({ message: "Company not found" });
    }

    const updatedData = { ...user._doc, ...req.body };

    if (req.file) {
      updatedData.profilePicture = req.file.path;
    }

    // Update the user profile
    let updateUser = await UserService.update({ userId }, updatedData);
    console.log(updateUser);

    // Set profileStatus to true
    let profileStatus = await UserService.update({ userId }, { profileStatus: true });
    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



router.get("/companyUser", jwt, async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: "Invalid user token" });
    }
    
    let userId = req.user.userId;
    console.log(userId);

    let user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Users List

router.get("/usersList",async(req,res)=>{
  try{
    let users = await User.find();
    console.log(users);
    if(!users || users.length == 0){
      return res.status(404).json({ message: "No user found" });
    }
    res.status(200).json({ message:"Users are",users});
  }
  catch(error){
    return res.status(500).send({ message: "Internals erver error" });
  }
})




//List of users with Time Exchange

router.get("/timeExchangeUsers",async(req, res, next)=>{
try{
  let users = await User.find({
    $or: [
      { timeExchangeDescription: { $ne: null, $ne: "" } },
      { availableFrom: { $ne: null, $ne: "" } },
      { availableTill: { $ne: null, $ne: "" } }
    ]
  });
    if( !users ||users.length ==0){
    return res.status(404).send({ message: "Users not found" });
  }
  res.status(200).send({ message:"Users are",users });
}
catch(error){
  console.log(error);
  res.status(500).send({ message: "Internals erver error" });
}
})

router.get('/timeExchangeUsers',async (req, res) => {
  try{
      const request = req.query;
      let result = await UserService.timeExchangeUsers(request.pageNo, request.searchValue,request.startDate,request.endDate);  

      return sendSuccessResponse(res, "Request Successful", result);

  }
  catch (error) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
  }
});

// List of Companies

router.get("/companiesList", async (req, res) => {
try{
  let companyList = await User.find({role: "2"});
  if( !companyList || companyList.length == 0){
     return res.status(404).send({ message: "No company found" });
  }
  res.status(200).send({ message:"List of companies is", companyList})
}
catch(error){
  console.log(error);
  res.status(500).send({error, message: "Internal server error"})
}
})

// Paginated Companies List
router.get('/companiesList',async (req, res) => {
  try{
      const request = req.query;
      let result = await UserService.companiesList(request.pageNo, request.searchValue,request.startDate,request.endDate);  

      return sendSuccessResponse(res, "Request Successful", result);

  }
  catch (error) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
  }
});



// PDF Export
// router.get("/pdfResume/:userId",  async (req, res, next) => {
//   let userId = req.params.userId;

//   try {
//     const user = await UserService.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Define the path to the HTML resume template
//     const templatePath = path.join(__dirname, '..', 'resume_template', 'resume_template.html');

//     // Read the HTML template file
//     const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

//     // Create a replacement object with placeholders and corresponding values
//     const replacementObject = {
//       '{{user.name}}': user.name,
//       '{{user.email}}': user.email,
//       '{{user.cnicNo}}': user.cnicNo,
//       '{{user.dob}}': user.dob,
//       '{{user.phoneNo}}': user.phoneNo,
//       '{{user.address}}': user.address,
//       '{{user.hobby}}': user.hobby,
//       '{{user.experience}}': user.experience,
//       '{{user.profilePicture}}': user.profilePicture,
//       '{{user.education}}': user.education,
//       '{{user.skills}}': user.skills,
//       '{{user.expectedSalary}}': user.expectedSalary,
//       '{{user.currentJob}}': user.currentJob
//     };

//     // Replace placeholders with actual values
//     const htmlContent = replacePlaceholders(htmlTemplate, replacementObject);

//     // Define options for PDF generation
//     const pdfOptions = {
//       format: 'Letter',
//       border: '10mm',
//       timeout: 30000 // Increase timeout if necessary
//     };

//     // Generate PDF
//   pdf.create(htmlContent, pdfOptions).toFile((err, { filename}) => {
//       if (err) {
//         console.error("Error exporting PDF:", err);
//         res.status(500).json({ error: "Internal Server Error in PDF Export" });
//       }
//       //  else {
//       //   console.log("in");
//       //   console.log(filename);
//       //   // Send the PDF file path in the response
//       //   res.json({ filePath: filename });
//       // }
//       {
//         console.log("PDF created successfully");
//         console.log(filename);
//         // Send the PDF file for download
//         res.download(filename, 'downloadedFile.pdf', (err) => {
//           if (err) {
//             console.error("Error sending the file:", err);
//             res.status(500).json({ error: "Internal Server Error in sending the file" });
//           } else {
//             console.log("File sent successfully");
//           }
//         });
//       }
//     });
//   } catch (error) {
//     console.error("Error exporting PDF:", error);
//     res.status(500).json({ error: "Internal Server Error in PDF Export" });
//   }
// });
// // Function to replace placeholders with actual values in HTML content
// function replacePlaceholders(content, replacements) {
//   let result = content;
//   for (const [placeholder, value] of Object.entries(replacements)) {
//     result = result.replace(new RegExp(placeholder, 'g'), value);
//   }
//   return result;
// }

router.get("/pdfResume/:userId", jwt, async (req, res, next) => {
  let userId = req.params.userId;
  console.log("Received userId:", userId);
  try {
    const user = await UserService.findById(userId);
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sanitizedUserName = user.name.replace(/[^a-zA-Z0-9]/g, '_');

    const doc = new PDFDocument();

    const uploadsFolder = path.join(__dirname, "..", "..", "downloads");
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }
    const filePath = path.join(uploadsFolder, `${sanitizedUserName}_resume.pdf`);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.text(` Name: ${user.name}`);
    doc.text(` Email: ${user.email}`);
    doc.text(` CNIC No: ${user.cnicNo}`);
    doc.text(` Date of Birth: ${user.dob}`);
    doc.text(` Phone No: ${user.phoneNo}`);
    doc.text(` Address: ${user.address}`);
    doc.text(` City: ${user.city}${user.state}${user.country}`);
    doc.text(` Country: ${user.address}`);
    doc.text(` Hobby: ${user.hobby}`);
    doc.text(` Experience: ${user.experience}`);
    doc.text(` Profile Picture: ${user.profilePicture}`);
    doc.text(` Education: ${user.education}`);
    doc.text(` Skill: ${user.skills}`);
    doc.text(` Expected Salary: ${user.expectedSalary}`);
    doc.text(` Current Job: ${user.currentJob}`);
    doc.moveDown();

    doc.end();

    stream.on('finish', () => {
      res.json({ filePath: `/uploads/${sanitizedUserName}_resume.pdf` });
    });

  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});







//CSV export file
router.get("/export",jwt, async (req, res, next) => {
  let userId = req.user.userId;
  try {
    // Retrieve product data
    const users = await UserService.list();

    // Format product data into CSV
    const fields = [
      "_id",
      "name",
      "email",
      "type",
      "jobRole",
      "createdBy",
      "createdAt",
      "updatedAt",
    ];
    const csv = parse(users, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "users.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response
    let text="User CSV file generated successfully!"
    let createdBy=userId;
    let log = await LogService.create(text,createdBy);
    
    res.json({ filePath: "/uploads/users.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});


//user creation data chart
router.get("/analytics", jwt, async (req, res) => {
  let userId = req.user.userId;
  try {
    // Fetch user data from the database
    const userData = await UserService.findAll();
    // Aggregate user data to count users created on each date
    const userCreationCounts = userData.reduce((counts, user) => {
      const date = user.createdAt.toISOString().split("T")[0]; // Extract date part
      counts[date] = (counts[date] || 0) + 1; // Increment count for the date
      return counts;
    }, {});
    // Extract labels (dates) and data (user counts)
    const labels = Object.keys(userCreationCounts);
    const data = Object.values(userCreationCounts);

    const result = {
      dateWiseUsers: { labels, data },
      totalUsers: 0,
    };
    // Send the data as JSON response
    let text="User chart analytics generated successfully!"
    let createdBy=userId;
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", result);
  } catch (error) {
    console.error("Error fetching user creation data:", error);
    return sendErrorResponse(
      res,
      "An Error Occured While listing User analytics"
    );
  }
});

// Routes
router.get("/:organizationId", jwt, async (req, res, next) => {
  let organizationId = req.params.organizationId;
  let request = req.query;

  let result = await UserService.list(
    organizationId,
    "Employee",
    request.pageNo,
    request.searchValue
  );

  return sendSuccessResponse(res, "Request Successful", result);
});



// Add entity as Employee 
router.post("/", jwt, checkCreateParams, async (req, res, next) => {
  let request = req.body;
  let authUser = req.user;
  const userId = req?.user?.userId;

  let modelUser = await UserService.findByEmail(request.email);
  if (modelUser != null) return sendErrorResponse(res, "Email Exist!");

  let randomPassword = GeneralHelper.passwordGenerator();
  let password = await GeneralHelper.randomPasswordMaker(randomPassword);
  let user = await UserService.create(
    request.name,
    authUser.organization,
    request.email,
    password,
    request.type,
    "Employee",
    userId
  );
  let text="User registered successfully!"
  let createdBy=userId;
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", user);
});

// Update entity details
router.patch("/:id", jwt, checkUpdateparams, async (req, res, next) => {
  let request = req.body;
  let id = req.params.id;
  let userId = req.user?.userId;

  let user = await UserService.update(
    { _id: id },
    { name: request.name, updatedBy: userId }
  );
  let text="User updated successfully!"
  let createdBy=userId;
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", user);
});

// Single Delete 
router.delete("/:id", jwt, async (req, res, next) => {
  let userId = req.user.userId;
  let id = req.params.id;

  await UserService.delete(id);
  let text="User deleted successfully!"
  let createdBy=userId;
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful");
});


 



// Single User profile Link for Email
router.get("/ApplicantProfile/:id", async (req, res, next) => {
  try {
    let userId = req.params.id;
    console.log(userId);

    let user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for conditional headers
    const ifModifiedSince = req.headers['if-modified-since'];
    const ifNoneMatch = req.headers['if-none-match'];

    // Get the last modified date of the user resource
    const lastModified = user.updatedAt;
    const etag = user._id; // Or any unique identifier for the resource

    // Check If-Modified-Since header
    if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
      return res.status(304).end();
    }

    // Check If-None-Match header
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    // Set response headers
    res.setHeader('Last-Modified', lastModified.toUTCString());
    res.setHeader('ETag', etag);

    return res.status(200).json({
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      address: user.address,
      education: user.education,
      skills: user.skills,
      currentJob: user.currentJob
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Contact US

router.post("/contactUs",async(req,res,next)=>{
  try{
    let {name,email, message}=req.body;
    console.log(req.body.email);
    if( !name || !email || !message ){
      return res.status(400).send("All fields are required !");
  }
    // Set up nodemailer transport  
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
       user: "smart.job.seekerr@gmail.com",
        pass: "lzhtpowswlbktkgt"
      }
    });
    const mailOptions = {
      // from: 'smart.job.seekerr@gmail.com',
      // to: req.body.email,
      from: req.body.email,
      to: 'smart.job.seekerr@gmail.com',
      subject: `New Contact Us Message from ${name}`,
      text: message,
    };
  
    //Send Email
    transporter.sendMail(mailOptions,(error,info)=>{
      if (error) {
        return res.status(500).send({
          success: false,
          message: 'Failed to send email. Please try again later.',      
    })}
    res.status(200).send({
      success: true,
      message: 'Email sent successfully!',
    });  
      }
  )
}
  catch(error){
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
  }
})

// Single User
router.get("/singleUser/:id", async (req, res) => {
  try {
    let userId = req.params.id; 
    console.log(userId);
    let users = await User.find({ _id: userId });
    if (users.length === 0) { 
      return res.status(404).json({ message: "No user found" });
    }
    res.status(200).json(users); 
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" }); 
  }
});


module.exports = router;
