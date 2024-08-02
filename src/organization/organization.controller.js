const express = require("express");
const router = express.Router();
const { parse } = require("json2csv");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

//JWT
const jwt = require("../middleware/jwt");

// Services
const OrganizationService = require("./organization.service");
const userService = require("../user/user.service");
const LogService = require("../log/log.service")

// Validations
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update");

// Response Helpers
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");

// List entities
router.get("/",jwt, async (req, res, next) => {
  let userId= req.user.userId;
  const request = req.query;
  console.log(request)
  let result = await OrganizationService.list(
    request.pageNo,
    request.searchValue,
    request.startDate,
    request.endDate
  );

  let text="Organization list  request successful"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", result);
});

//CSV Export
router.get("/export",jwt,  async (req, res, next) => {
  let userId = req.user.userId;
  try {
    // Retrieve product data
    const organizations = await OrganizationService.list();

    // Format product data into CSV
    const fields = [
      "_id",
      "name",
      "email",
      "location",
      "phoneNumber",
      "website",
      "createdAt",
      "updatedAt",
    ];
    const csv = parse(organizations, { fields });

    // Define file path within the 'uploads' folder
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "organizations.csv");

    // Save CSV to file
    fs.writeFileSync(filePath, csv);

    // Send relative file path as response

    let text="CSV file generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.json({ filePath: "/uploads/organizations.csv" });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Internal Server Error in CSV Export" });
  }
});

//PDF Export
router.get("/export1",jwt, async (req, res, next) => {
  let userId = req.user.userId;
  try {
    // Retrieve organization data
    const organizationsData = await OrganizationService.list();
    const organizations = organizationsData.data;
  
    // Create a new PDF document
    const doc = new PDFDocument();

    // Pipe the PDF content to a file
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsFolder, "organizations.pdf");
    const outputStream = fs.createWriteStream(filePath);
    doc.pipe(outputStream);

    // Add content to the PDF
   
    organizations.forEach(org => {
      doc.text(`_id: ${org._id}`);
      doc.text(`Name: ${org.name}`);
      doc.text(`Email: ${org.email}`);
      doc.text(`Location: ${org.location}`);
      doc.text(`Phone Number: ${org.phoneNumber}`);
      doc.text(`Website: ${org.website}`);
      doc.text(`Created At: ${org.createdAt}`);
      doc.text(`Updated At: ${org.updatedAt}`);
      doc.moveDown();
    });
  
    doc.end();
    
    let text="PDF file generated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.json({ filePath: "/uploads/organizations.pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ error: "Internal Server Error in PDF Export" });
  }
});

//organization creation data chart
router.get("/analytics", jwt, async (req, res) => {
  let userId= req.user.userId;
  try {
    // Fetch user data from the database
    const organizationData = await OrganizationService.findAll();
    // Aggregate user data to count users created on each date
    const organizationCreationCounts = organizationData.reduce(
      (counts, document) => {
        const date = document.createdAt.toISOString().split("T")[0]; // Extract date part
        counts[date] = (counts[date] || 0) + 1; // Increment count for the date
        return counts;
      },
      {}
    );
    // Extract labels (dates) and data (user counts)
    const labels = Object.keys(organizationCreationCounts);
    const data = Object.values(organizationCreationCounts);
    // Send the data as JSON response
    const result = {
      dateWiseOrganizations: { labels, data },
      totalDocuments: 0,
    };

    let text="Analytics list request successful"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(res, "Request Successful", result);
  } catch (error) {
    console.error("Error fetching Organization creation data:", error);
    return sendErrorResponse(
      res,
      "An error occured while listing organization analytics"
    );
  }
});

// Add entity
router.post("/addOrg", jwt, checkCreateParams, async (req, res, next) => {
  const { name, email, location, phoneNumber, website } = req.body;
  console.log(name,email,location,phoneNumber,website)
  const { adminName, adminEmail, password } = req.body;
  const userId= req.user.userId;
  try {
    let organizationModel = await OrganizationService.findByTitle(name);
    if (!(organizationModel == null))
      {return sendErrorResponse(res, "Alread Exist!");}

    let organization = await OrganizationService.create(
      name,
      email,
      location,
      phoneNumber,
      website
    );
    console.log("orgaization",organization)
    await userService.createAdmin(
      adminName,
      adminEmail,
      password,
      organization._id
    );

    let text="Organization created successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    return sendSuccessResponse(
      res,
      "Organization created successfully",
      organization
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return sendErrorResponse(
      res,
      `Failed to create organization: ${error.message}`
    );
  }
});

// Update entity
router.patch("/:id", jwt, checkUpdateparams, async (req, res, next) => {
  const userId= req.user.userId;
  const { name, email, location, phoneNumber, website } = req.body;
  const { id } = req.params;

  let organizationModel = await OrganizationService.findByTitle(name);
  if (organizationModel != null && organizationModel._id != id)
    return sendErrorResponse(res, "Already Exist");

  await OrganizationService.findAndUpdate(id, {
    name,
    email,
    location,
    phoneNumber,
    website,
  });
  let updatedorganization = await OrganizationService.findById(id);

  let text="Organization updated successfully"
  let createdBy=userId
  let log = await LogService.create(text,createdBy);
  return sendSuccessResponse(res, "Request Successful", updatedorganization);
});

// Delete entity
router.delete("/:id", jwt, async (req, res, next) => {
  let request = req.params;

  if (!request.id) return sendErrorResponse(res, "Id is Resquired!");
  await OrganizationService.delete(request.id);

  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
