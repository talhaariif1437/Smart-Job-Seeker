const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const PDFDocument = require('pdfkit');

// JWT
const jwt = require("../middleware/jwt.js");

// Services
const DocumentService = require("./document.service.js");
const LogService= require("../log/log.service.js")

//FileUpload
const upload = require("./requests/fileupload.js");

//validations
const checkCreateParams = require("./requests/create.js");
const checkUpdateparams = require("./requests/update.js");

//Response Helpers

const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service.js");

// List entities
router.get("/",jwt, async (req, res, next) => {
  try {
    let request = req.query;
    let userId = req.user.userId
    console.log("before call :", request.createdAt);
    const documents = await DocumentService.getParentChildList(
      request.pageNo,
      request.searchValue,
      request.startDate,
      request.endDate,

      request.createdAt
    );

    let text="List request successfull"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", documents);
  } catch (error) {
    console.error("Error listing documents:", error);
    return sendErrorResponse(res, "An error occurred while listing documents");
  }
});

//CSV export file
router.get("/export", jwt, async (req, res, next) => {
  let userId = req.user.userId;
  try {
    // Retrieve product data
    const documents = await DocumentService.list();

    // Format product data into CSV
    const fields = [
      "_id",
      "name",
      "description",
      "file",
      "createdAt",
      "updatedAt",
      "children._id",
      "children.name",
      "children.description",
      "children.file",
      "children.createdAt",
      "children.updatedAt",
    ];
    const csv = parse(documents, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "documents.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response
    let text="CSV file generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.json({ filePath: "/uploads/documents.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});


//PDF export file
router.get("/export1",jwt,  async (req, res, next) => {
  let userId = req.user.userId;
  try {
    // Retrieve document data
    const documents = await DocumentService.list();

    // Create a new PDF document
    const doc = new PDFDocument();

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "documents.pdf");

    // Pipe the PDF document to a writable stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Write document data to PDF
    documents.forEach(document => {
      doc.text(`Document ID: ${document._id}`);
      doc.text(`Name: ${document.name}`);
      doc.text(`Description: ${document.description}`);
      doc.text(`Created At: ${document.createdAt}`);
      doc.moveDown();
    });

    doc.end();

      // Send relative file path as response
      let text="PDF file generated successfully"
      let createdBy=userId
      let log = await LogService.create(text,createdBy);  
    res.json({ filePath: "/uploads/documents.pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});




//document creation data chart
router.get("/analytics", jwt, async (req, res) => {
  let userId = req.user.userId;
  try {
    // Fetch user data from the database
    const documentData = await DocumentService.findAll();
    // Aggregate user data to count users created on each date
    const documentCreationCounts = documentData.reduce((counts, document) => {
      const date = document.createdAt.toISOString().split("T")[0]; // Extract date part
      counts[date] = (counts[date] || 0) + 1; // Increment count for the date
      return counts;
    }, {});
    // Extract labels (dates) and data (user counts)
    const labels = Object.keys(documentCreationCounts);
    const data = Object.values(documentCreationCounts);
    // Send the data as JSON response
    const result = {
      dateWiseDocuments: { labels, data },
      totalDocuments: 0,
    };
    let text="Analytics list generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", result);
  } catch (error) {
    console.error("Error fetching document creation data:", error);
    return sendErrorResponse(res, "An error occurred while listing Analytics");
  }
});

// Add entity
router.post(
  "/",
  jwt,
  upload.single("file"),
  checkCreateParams,

  async (req, res, next) => {
    const { name, description, parent } = req.body;
    const userId = req.user.userId;
    const file = req.file.path;
    try {
      let documentModel = await DocumentService.findByTitle(name);
      if (!(documentModel == null))
        return sendErrorResponse(res, "Name Alread Exist!");

      //   let imagePaths = req.files.map((file) => file.path);

      let document = await DocumentService.create(
        name,
        description,
        parent,
        file,
        userId
      );
      let text="Document created successfully"
      let createdBy=userId
      let log = await LogService.create(text,createdBy);
      return sendSuccessResponse(
        res,
        "document created successfully",
        document
      );
    } catch (error) {
      console.error("Error creating document:", error);
      return sendErrorResponse(
        res,
        `Failed to create document: ${error.message}`
      );
    }
  }
);

// Update entity
router.patch(
  "/:id",
  jwt,
  upload.single("file"),
  checkUpdateparams,
  async (req, res, next) => {
    const { name } = req.body;
    const { id } = req.params;
    const userId = req.user.userId;
    const filepath = req.file.path;

    let documentModel = await DocumentService.findByTitle(name);
    if (documentModel != null && documentModel._id != id)
      return sendErrorResponse(res, "Already Exist");

    await DocumentService.findAndUpdate(id, req.body, filepath, userId);
    let updatedProduct = await DocumentService.findById(id);
    
    let text="Document updated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", updatedProduct);
  }
);

// Delete entity
router.delete("/:id", jwt, async (req, res, next) => {
  let userId= req.user.userId;
  let request = req.params;

  if (!request.id) return sendErrorResponse(res, "Id is Resquired!");
  await DocumentService.delete(request.id);
  let text="Document deleted successfully"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
