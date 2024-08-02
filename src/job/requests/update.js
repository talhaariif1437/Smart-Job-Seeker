const { sendErrorResponse } = require("../../shared/response.service");

module.exports = (req, res, next) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);
  const missingParams = [];
  const requiredParams = [
    "title", "companyName", "description", "type", "positions", "startDate",
    "country", "state", "city", "education", "industry", "experience", "skills",
    "salary", "zip"
];
  // Check for the required parameters in req.body
  requiredParams.forEach((param) => {
    if (!req.body[param]) {
      missingParams.push(param);
    }
  });

  if (missingParams.length > 0) {
    return sendErrorResponse(
      res,
      `${missingParams.join(" and ")}: is required`
    );
  }

  next();
};