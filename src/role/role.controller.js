const express = require("express");
const router = express.Router();

// Helpers
const RoleHelper = require("./role.service");

//validattions
const checkCreateParams = require("./requests/create");
const checkUpdateparams = require("./requests/update");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../shared/response.service");

// List entities
router.get("/", async (req, res, next) => {
  let result = await RoleHelper.list();
  return sendSuccessResponse(res, "Request Successful", result);
});

// Add entity
router.post("/", checkCreateParams, async (req, res, next) => {
  let request = req.body;

  if (!request.title) return sendErrorResponse(res, "Missing Parameters");

  let modelRole = await RoleHelper.findByTitle(request.title);
  if (!(modelRole == null)) return sendErrorResponse(res, "Alread Exist!");

  let role = await RoleHelper.create(request.title);

  return sendSuccessResponse(res, "Request Successful", role);
});

// Update entity
router.patch("/:id", checkUpdateparams, async (req, res, next) => {
  let request = req.body;

  let modelRole = await RoleHelper.findByTitle(request.title);
  if (modelRole != null && modelRole._id != request.id)
    return sendErrorResponse(res, "Already Exist");

  let role = await RoleHelper.update(
    { _id: request.id },
    { title: request.title }
  );

  return sendSuccessResponse(res, "Request Successful", role);
});

// Delete entity
router.delete("/:id", async (req, res, next) => {
  let request = req.params;

  if (!request.id) return sendErrorResponse(res, "Missing Parameters");

  await RoleHelper.delete(request.id);

  return sendSuccessResponse(res, "Request Successful");
});

module.exports = router;
