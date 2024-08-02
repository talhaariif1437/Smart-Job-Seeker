const { sendErrorResponse } = require("../../shared/response.service");

module.exports = (req, res, next) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);
  const missingParams = [];
  const requiredParams = ["name", "description"];

  // Check for the required parameters in req.body
  requiredParams.forEach((param) => {
    if (!req.body[param]) {
      missingParams.push(param);
    }
  });

  // Check for the existence of the uploaded file
  if (!req.file) {
    missingParams.push("file");
  }

  if (missingParams.length > 0) {
    return sendErrorResponse(
      res,
      `${missingParams.join(" and ")}: is required`
    );
  }

  next();
};
