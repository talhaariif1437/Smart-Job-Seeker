const { sendErrorResponse } = require("../../shared/response.service");

module.exports = (req, res, next) => {
  console.log("req.body:", req.body);
  const missingParams = [];
  const requiredParams = [
    "title", "companyName", "description", "type", "positions", "startDate",
    "country", "education", "industry", "experience", "skills",
    "salary", "zip"
];
  // Check for the required parameters in req.body
  requiredParams.forEach((param) => {
    if (!req.body.job[param]) {
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
