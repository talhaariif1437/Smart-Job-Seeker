const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const PDFDocument = require('pdfkit');


// Middlewares
const jwt = require("../../middleware/jwt.js");

// Helpers
const CategoryService = require("./category.service.js");


//validattions
const checkCreateParams = require("./requests/create.js");
const checkUpdateparams = require("./requests/update.js");

//Response Helpers
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../../shared/response.service");

// List entities
router.get("/", async (req, res, next) => {
  const request = req.query;

  let result = await CategoryHelper.list(request.pageNo, request.searchValue,  request.startDate,
    request.endDate);
  return sendSuccessResponse(res, "Request Successful", result);
});

//CSV Export
router.get("/export",jwt,  async (req, res, next) => {
  try {
    // Retrieve product data
    const categories = await CategoryService.list();

    // Format product data into CSV
    const fields = ["_id", "name", "createdAt", "updatedAt"];
    const csv = parse(categories, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "categories.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response
    res.json({ filePath: "/uploads/categories.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});

// PDF Export
router.get("/export1",jwt, async (req, res, next) => {
  try {
    // Retrieve product data
    const categoriesData = await CategoryService.list();
    const categories= categoriesData.data

    // Create a new PDF document
    const doc = new PDFDocument();

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "categories.pdf");

    // Pipe the PDF document to a writable stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Iterate through categories

    categories.forEach((category) => {
      doc.text(`Category ID: ${category._id}`);
      doc.text(`Category Name: ${category.name}`);
      doc.text(`Created At: ${category.createdAt}`);
      doc.text(`Updated At: ${category.updatedAt}`);
      doc.moveDown();
    });
  
    doc.end();

    // Send relative file path as response
    res.json({ filePath: "/uploads/categories.pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});

// Add entity
router.post("/", jwt, checkCreateParams, async (req, res, next) => {
  let request = req.body;
  const userId = req.user?.userId;

  let modelCategory = await CategoryService.findByTitle(request.name);
  if (!(modelCategory == null)) return sendErrorResponse(res, "Alread Exist!");

  let category = await CategoryService.create(request.name, userId);

  return sendSuccessResponse(res, "Request Successful", category);
});

// Update entity
router.patch("/:id", jwt, checkUpdateparams, async (req, res, next) => {
  let request = req.body;
  const userId = req.user?.userId;
  const id = req.params.id;

  let modelCategory = await CategoryService.findByTitle(request.name);
  if (modelCategory != null && modelCategory._id != request.id)
    return sendErrorResponse(res, "Already Exist");

  let category = await CategoryService.update(
    { _id: id },
    { name: request.name, updatedBy: userId }
  );

  return sendSuccessResponse(res, "Request Successful", category);
});

// Delete entity
router.delete("/:id", jwt, async (req, res, next) => {
  let request = req.params;

  await CategoryService.delete(request.id);

  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
