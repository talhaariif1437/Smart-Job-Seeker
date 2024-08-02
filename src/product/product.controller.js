const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const PDFDocument = require('pdfkit');


// Middlewares
const jwt = require("../middleware/jwt.js");

// Services
const ProductService = require("./products.service.js");
const LogService= require("../log/log.service.js")

//FileUpload
const upload = require("./requests/imageUpload.js");

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
  let userId= req.user.userId;
  const request = req.query;
  let result = await ProductService.list(request.pageNo, request.searchValue,request.startDate,request.endDate);    
  
  let text="Order found against User Id !"
  let createdBy=userId;
  let log = await LogService.create(text,createdBy);

});

//CSV Export
router.get("/export",jwt,  async (req, res, next) => {
  try {
    // Retrieve product data
    const products = await ProductService.list();
    // Format product data into CSV
    const fields = [
      "_id",
      "name",
      "price",
      "description",
      "category",
      "createdAt",
      "updatedAt",
    ];
    const csv = parse(products, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "products.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response
    res.json({ filePath: "/uploads/products.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});

// PDF Export
router.get("/export1",jwt, async (req, res, next) => {
  try {
    // Retrieve product data
    const productsData = await ProductService.list();
    const products = productsData.data
    // Create a new PDF document
    const doc = new PDFDocument();

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "products.pdf");

    // Pipe the PDF document to a writable stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Check if products is an array before iterating
      products.forEach(product => {
        doc.text(`Product Name: ${product.name}`);
        doc.text(`Description: ${product.description}`);
        doc.text(`Price: ${product.price}`);
        doc.text(`Created At: ${product.createdAt}`);
        doc.moveDown();
      });
    doc.end();

    res.json({ filePath: "/uploads/products.pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});

//Graphs
router.get("/analytics", jwt, async (req, res) => {
  try {
    // Fetch user data from the database
    const productData = await ProductService.findAll();
    // Aggregate user data to count users created on each date
    const productCreationCounts = productData.reduce((counts, product) => {
      const date = product.createdAt.toISOString().split("T")[0]; // Extract date part
      counts[date] = (counts[date] || 0) + 1; // Increment count for the date
      return counts;
    }, {});
    // Extract labels (dates) and data (user counts)
    const labels = Object.keys(productCreationCounts);
    const data = Object.values(productCreationCounts);
    // Send the data as JSON response
    const result = {
      dateWiseProducts: { labels, data },
      totalProducts: 0,
    };
    return sendSuccessResponse(res, "Request Successful", result);
  } catch (error) {
    console.error("Error fetching Products creation data:", error);
    return sendErrorResponse(
      res,
      "An Error occured while listing products analytics"
    );
  }
});

// Add entity
router.post(
  "/",
  jwt,
  upload.any(),
  checkCreateParams,

  async (req, res, next) => {
    const { name, price, picture, description, categoryId } = req.body;
    const userId = req.user.userId;
    try {
      let productModel = await ProductService.findByTitle(name);
      if (!(productModel == null))
        return sendErrorResponse(res, "Alread Exist!");

      let imagePaths = req.files.map((file) => file.path);

      let product = await ProductService.create(
        name,
        price,
        picture,
        description,
        imagePaths,
        categoryId,
        userId
      );
      return sendSuccessResponse(res, "Product created successfully", product);
    } catch (error) {
      console.error("Error creating product:", error);
      return sendErrorResponse(
        res,
        `Failed to create product: ${error.message}`
      );
    }
  }
);

// Update entity
router.patch(
  "/:id",
  jwt,
  upload.any(),
  checkUpdateparams,
  async (req, res, next) => {
    const { name } = req.body;
    const { id } = req.params;
    const userId = req.user.userId;

    let productModel = await ProductService.findByTitle(name);
    if (productModel != null && productModel._id != id)
      return sendErrorResponse(res, "Already Exist");

    let imagePaths = req.files.map((file) => file.path);

    await ProductService.findAndUpdate(id, req.body, imagePaths, userId);
    let updatedProduct = await ProductService.findById(id);

    return sendSuccessResponse(res, "Request Successful", updatedProduct);
  }
);

// Delete entity
router.delete("/:id", jwt, async (req, res, next) => {
  let request = req.params;

  if (!request.id) return sendErrorResponse(res, "Id is Resquired!");
  await ProductService.delete(request.id);

  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
