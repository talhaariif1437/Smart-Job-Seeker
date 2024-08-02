const { sendErrorResponse } = require("../../shared/response.service");

module.exports = (req, res, next) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);
  const missingParams = [];
  const requiredParams = ["shippingDetails", "billingDetails", "itemsList"];

  // Check for the required parameters in req.body
  requiredParams.forEach((param) => {
    if (!req.body[param]) {
      missingParams.push(param);
    }
  });

  // Check for required parameters in shippingDetails
  if (req.body.shippingDetails) {
    const shippingDetailsParams = ["name", "address", "phoneNo"];
    shippingDetailsParams.forEach((param) => {
      if (!req.body.shippingDetails[param]) {
        missingParams.push(`shippingDetails.${param}`);
      }
    });
  } else {
    missingParams.push("shippingDetails");
  }

  // Check for required parameters in billingDetails
  if (req.body.billingDetails) {
    const billingDetailsParams = ["name", "address", "phoneNo"];
    billingDetailsParams.forEach((param) => {
      if (!req.body.billingDetails[param]) {
        missingParams.push(`billingDetails.${param}`);
      }
    });
  } else {
    missingParams.push("billingDetails");
  }

  // Check for required parameters in itemsList
  if (req.body.itemsList && req.body.itemsList.length > 0) {
    req.body.itemsList.forEach((item, index) => {
      const itemParams = ["productId", "quantity"];
      itemParams.forEach((param) => {
        if (!item[param]) {
          missingParams.push(`itemsList[${index}].${param}`);
        }
      });
    });
  } else {
    missingParams.push("itemsList");
  }

  if (missingParams.length > 0) {
    return sendErrorResponse(
      res,
      `Missing required parameters: ${missingParams.join(", ")}`
    );
  }

  next();
};
