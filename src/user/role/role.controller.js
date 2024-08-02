const express = require("express");
const router = express.Router();

// Services
const RoleServices = require("./role.service");

//validations
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");

// List entities
router.get("/", async (req, res, next) => {
  let result = await RoleServices.list();
  return sendSuccessResponse(res, "Request Successful", result);
});

// Add entity
router.post("/", checkCreateParams, async (req, res, next) => {
  let request = req.body;

  if (!request.title) return sendErrorResponse(res, "Missing Parameters");

  let modelRole = await RoleServices.findByTitle(request.title);
  if (!(modelRole == null)) return sendErrorResponse(res, "Alread Exist!");

  let role = await RoleServices.create(request.title);

  return sendSuccessResponse(res, "Request Successful", role);
});

// Update entity
router.patch("/:id", checkUpdateparams, async (req, res, next) => {
  let request = req.body;

  let modelRole = await RoleServices.findByTitle(request.title);
  if (modelRole != null && modelRole._id != request.id)
    return sendErrorResponse(res, "Already Exist");

  let role = await RoleServices.update(
    { _id: request.id },
    { title: request.title }
  );

  return sendSuccessResponse(res, "Request Successful", role);
});

// Delete entity
router.delete("/:id", async (req, res, next) => {
  let request = req.params;

  if (!request.id) return sendErrorResponse(res, "Missing Parameters");

  await RoleServices.delete(request.id);

  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
