const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const nodeMailer = require("nodemailer");
const jwt = require("../middleware/jwt");
const Job = require("./job.model");
const User = require("../user/user.model");


//Job Service
const UserService = require("../user/user.service.js")
const JobService = require("./job.service");
const { recommendedJobList,internationalJobList } = require('./job.service');

//Response Helpers

const {
    sendSuccessResponse,
    sendErrorResponse,
  } = require("../shared/response.service.js");

// Validations
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update.js");


///////////////////////////////////////////////////////////////////////////

//Job Post
router.post("/jobPost", jwt,checkCreateParams,async (req, res, next) => {
    let organizationId = req.user.userId;
    console.log(organizationId)
    const {
        title,
        companyName,
        description,
        type,
        positions,
        startDate,
        endDate,
        country,
        state,
        city,
        education,
        industry,
        experience,       
        skills,
        salary,        
        zip
    } = req.body.job;

    try {
        console.log(req.body.job);
        const _id = new mongoose.Types.ObjectId();
        let job = await Job.create({
            _id,
            title,
            companyName,
            description,
            type,
            positions,
            education,
            experience,
            industry,
            skills,
            salary,
            startDate,
            endDate,
            organizationId,
            country,
            state,
            city,
            zip,
        }); 
        if (job) {
            return res.status(200).json({ message: "Job added successfully",job });
        } else {
            return res.status(400).json({ message: "Failed to post job" });
        }
    } catch (error) {
        console.log("Error posting job:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});

// Job Count

router.post("/jobViewCount/:id", async (req, res) => {
    try {
      const jobId = req.params.id;
  
      let jobCount = await Job.findOneAndUpdate({_id:jobId}, {$inc: {viewCount:1}}, {new: true, lean: true});
  
      if (jobCount) {
        const updatedViewCount = jobCount.viewCount;
        return res.status(200).send({ message: "Job Count updated successfully", viewCount: updatedViewCount });
      }
  
      return res.status(404).send({ message: "Job not found" });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal server error" });
    }
  });
  
//Company Job List
router.get('/companyJobList', jwt, async (req, res) => {
  try {
    let userId = req.user.userId;

    let jobs = await Job.find({ organizationId: userId });

    if (!jobs || jobs.length === 0) {
      return res.status(404).send({ message: "No Jobs found" });
    }

    return res.status(200).send({ message: "Jobs are:", jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});


//Job List
// router.get('/jobsList',jwt, async (req, res) => {
//     try {
//         const jobs = await Job.find()
//         if(!jobs){
//             return res.status(404).json({ message: "No jobs found" });
//         }
//         return res.status(200).json(jobs);
//     } 

//     catch (error) {
//         console.error("Error fetching jobs:", error);
//         return res.status(500).json({ message: "Internal Server Error", error });
//     }
// });

//Paginated Job List
router.get('/jobsList',jwt, async (req, res) => {
    try{
        const request = req.query;
        let result = await JobService.list(request.pageNo, request.searchValue,request.startDate,request.endDate);  

        return sendSuccessResponse(res, "Request Successful", result);

    }
    catch (error) {
        console.error("Error fetching jobs:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
//Paginated Job List for landing page
router.get('/jobList', async (req, res) => {
    try{
        const request = req.query;
        let result = await JobService.list(request.pageNo, request.searchValue,request.startDate,request.endDate);  

        return sendSuccessResponse(res, "Request Successful", result);

    }
    catch (error) {
        console.error("Error fetching jobs:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});




// 1 Job Item This is showing Details of a job
router.get("/jobItem/:id",jwt,async(req,res)=>{
    const jobId= req.params.id
    try{
        const job = await Job.findById(jobId);
        if(job)
          return  res.status(200).json({message:"Job found", job});

        return res.status(404).json({ message: "Job not found"});
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
})
//Update Job
router.patch('/job/:id',jwt,checkUpdateparams, async (req, res) => {
    const jobId = req.params.id;
    const {
        title,
        companyName,
        description,
        type,
        positions,
        startDate,
        endDate,
        country,
        state,
        city,
        education,
        industry,
        experience,       
        skills,
        salary,        
        zip
    } = req.body

    try {
        let job = await Job.findOneAndUpdate({_id:jobId},req.body,{new:true});
        
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        console.log("Job updated successfully")
        return res.status(200).json({ message: "Job updated successfully", job });
    } catch (error) {
        console.error("Error updating job:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});

//Delete Job
router.delete("/deleteJob/:id",jwt,async(req,res)=>{
   let jobId= req.params.id;
   try{
    let job = await Job.findById(jobId);
    if(!job){
        return res.status(404).json({ message: "Job not found" });
    }
    await Job.deleteOne({_id:jobId});
    return res.status(200).json({ message: "Job deleted successfully",job });
   }
   catch(error){
    console.log("Failed to delete job:", error);
    res.status(500).json({ message: "Internal server error"});
   } 
})


//Job Recommendation
router.get("/jobRecommend",jwt,async(req,res)=>{
   const userId = req.user.userId;

   try{
      
    let user = await User.findById(userId);
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    console.log("User skills are:", user.skills)
    let matchingJobs = await Job.find({
        skills:{$in:user.skills}
    })

    console.log("Matching jobs are:", matchingJobs)
    if(!matchingJobs.length === 0 ){
        return res.status(404).json({ message: "No recommended jobs found" });
    }
    return res.status(200).json({ message:"Recommended jobs are",matchingJobs});
   }
   catch(error){
    console.log("Failed to recommend job:", error);
    res.status(500).json({ message: "Internal server error",error});
   }


})

// // Paginated Job Recommendation

router.get("/jobRecommend", jwt, async (req, res) => {
    const userId = req.user.userId;
    const { pageNo, searchValue, startDate, endDate } = req.query;
  
    try {
      let recommendedJobs = await recommendedJobList(
        userId,
        parseInt(pageNo) || 1,
        searchValue || "",
        startDate || null,
        endDate || null
      );
  
      if (recommendedJobs.data.length === 0) {
        return res.status(404).json({ message: "No recommended jobs found" });
      }
  
      return res.status(200).json({
        message: "Recommended jobs are",
        pagination: recommendedJobs.pagination,
        data: recommendedJobs.data
      });
    } catch (error) {
      console.log("Failed to recommend job:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  });


//International Job
router.get("/internationalJob", jwt, async (req, res) => {
    const userId = req.user.userId;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.country) {
            return res.status(400).json({ message: "User country is not defined" });
        }
        console.log("User country is:", user.country);

        let internationalJobs = await Job.find({
            country: { $ne: user.country }
        });
        
        internationalJobs.forEach(job => {
            console.log("Job country is:", job.country);
        });


        if (internationalJobs.length === 0) {
            return res.status(404).json({ message: "No international jobs found" });
        }

        console.log(internationalJobs.length);
        return res.status(200).json({ message: "International jobs are available", internationalJobs });
    } catch (error) {
        console.log("Failed to retrieve international jobs:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});

// // Paginated International Job

router.get("/internationalJob", jwt, async (req, res) => {
    const userId = req.user.userId;
    const { pageNo, searchValue, startDate, endDate } = req.query;
  
    try {
      let internationalJobs = await internationalJobList(
        userId,
        parseInt(pageNo) || 1,
        searchValue || "",
        startDate || null,
        endDate || null
      );

      if (internationalJobs.data.length === 0) {
        return res.status(404).json({ message: "No international jobs found" });
      }
      return res.status(200).json({
          message: "Recommended jobs are",
          pagination: internationalJobs.pagination,
          data: internationalJobs.data
        });
    } catch (error) {
      console.log("Failed to recommend job:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  });

// Apply for job
 router.post("/applyJob/:jobId",jwt,async(req,res,next)=>{
  try{
    let userId= req.user.userId;
    let user= await User.findById({_id: userId});
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    
    let jobId= req.params.jobId;
    let job = await Job.findById({_id:jobId});

    if (!job) {
      return res.status(404).send({ message: "Job not found" });
    }

    const jobTitle = job.title;
    const companyId = job.organizationId;

    let company = await User.findById({_id:companyId});
    if(!company){
      return res.status(404).send({ message: "Company not found!" });
    }

    let companyEmail = company.email;
    let companyName = company.name;

    let profileUrl=  `${process.env.APP_URL_FRONTEND}/ApplicantProfile/${userId}` ;


    console.log(`Sending email to: ${companyEmail}`);


    //Send Email
    const mailOptions = {
      from: 'smart.job.seekerr@gmail.com',
      to: companyEmail,
      subject: `Job Application: ${jobTitle}`,
      text: `Dear ${companyName},\n\n${user.name} has applied for the position of ${jobTitle}.\n\nYou can view applicant profile here: ${profileUrl}\n\nBest regards,\nSmart Job Seeker`
    };
    

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

    //Send email

    await transporter.sendMail(mailOptions);
   
    res.status(200).send({ message: "Application submitted successfully" });

  }
  catch (error) {
    console.log( error);
    res.status(500).json({ message: "Internal server error", error });
  }
 })

 
module.exports = router;