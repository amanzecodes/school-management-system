import express from "express";
import { ActionController } from "../controllers/action.controllers";
import { protectRoute, requireRole } from "../middleware/middleware";

const router = express.Router();

router.post(
  "/single/:userId/:subjectId",
  protectRoute,
  requireRole("TEACHER"),
  (req, res) => ActionController.SingleUpload(req as any, res as any)
);

export default router;
