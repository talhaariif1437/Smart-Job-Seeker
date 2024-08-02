const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const PDFDocument = require('pdfkit');


//JWT
const jwt = require("../middleware/jwt.js");

//Log Service
const LogService =require("../log/log.service.js")

// Services
const DepartmentService = require("./department.service");

// Validations
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update");

//Response Helpers
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");

// List entities
router.get("/", jwt, async (req, res, next) => {
  let userId= req.user.userId;

  const request = req.query;
  let result = await DepartmentService.list(
    request.pageNo,
    request.searchValue,
    request.startDate,
    request.endDate
  );
  let text="List request successfull"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", result);
});

// Analytics
router.get("/analytics", jwt, async (req, res) => {
  let userId= req.user.userId;
  try {
    // Fetch user data from the database
    const departmentData = await DepartmentService.findAll();
    // Aggregate user data to count departments created on each date
    const departmentCreationCounts = departmentData.reduce(
      (counts, department) => {
        const date = department.createdAt.toISOString().split("T")[0]; // Extract date part
        counts[date] = (counts[date] || 0) + 1; // Increment count for the date
        return counts;
      },
      {}
    );
    // Extract labels (dates) and data (user counts)
    const labels = Object.keys(departmentCreationCounts);
    const data = Object.values(departmentCreationCounts);

    const result = {
      dateWiseDepartments: { labels, data },
      totalDepartments: 0,
    };
    let text="Analytics list request successfull"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", result);
  } catch (error) {
    console.error("Error fetching department creation data:", error);
    return sendErrorResponse(res, "Internal Server Error");
  }
});

// Add entity
router.post("/", jwt, checkCreateParams, async (req, res, next) => {
  let request = req.body;
  let userId =req.user.userId
  let modelDepartment = await DepartmentService.findByTitle(request.title);
  if (!(modelDepartment == null))
    return sendErrorResponse(res, "Alread Exist!");

  let department = await DepartmentService.create(request.title);
  let text="Department added successfully"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", department);
});

//CSV export file
router.get("/export", jwt, async (req, res, next) => {
  let userId= req.user.userId;
  try {
    // Retrieve product data
    const departments = await DepartmentService.list();

    // Format product data into CSV
    const fields = ["_id", "title", "createdAt", "updatedAt"];
    const csv = parse(departments, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "departments.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response
    let text="CSV file generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.json({ filePath: "/uploads/departments.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});
//PDF export file
router.get("/export1",jwt, async (req, res, next) => {
  let userId= req.user.userId;
  try {
    // Retrieve department data
    const { data: departments } = await DepartmentService.list();

    // Create a new PDF document
    const doc = new PDFDocument();

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "departments.pdf");

    // Pipe the PDF document to a writable stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Write department data to PDF
    departments.forEach(department => {
      doc.text(`Department ID: ${department._id}`);
      doc.text(`Title: ${department.title}`);
      doc.text(`Created At: ${department.createdAt}`);
      doc.text(`Updated At: ${department.updatedAt}`);
      doc.moveDown();
    });

    // Finalize the PDF document
    doc.end();

    // Send relative file path as response
    let text="Pdf file generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.json({ filePath: "/uploads/departments.pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});




// Update entity
router.patch("/:id", jwt, checkUpdateparams, async (req, res, next) => {
  let userId = req.user.userId;
  let request = req.body;
  const id = req.params.id;

  let modelDepartment = await DepartmentService.findByTitle(request.title);
  if (modelDepartment != null && modelDepartment._id != request.id)
    return sendErrorResponse(res, "Already Exist");

  let role = await DepartmentService.update(
    { _id: id },
    { title: request.title }
  );
  let text="Department updated successfully"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", role);
});

// Delete entity
router.delete("/:id", jwt, async (req, res, next) => {
  let userId = req.user.userId;
  let request = req.params;

  await DepartmentService.delete(request.id);
  let text="Department deleted successfully"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
