import express from "express";
import { userController } from "../controllers/user.controllers";
import { protectRoute, requireRole } from "../middleware/middleware";

const router = express.Router();

router.get("/me", protectRoute, (req, res) => {
  userController.getCurrentUser(req, res);
});

router.get("/dashboard/stats", protectRoute, (req, res) => {
  userController.getDashboardStats(req, res);
});

router.get("/teacher", protectRoute, requireRole("TEACHER"), (req, res) => {
  userController.getTeacherDashboard(req, res);
});

router.get("/announcements", protectRoute, (req, res) => {
  userController.getAnnouncements(req, res);
});

router.post("/post/announcement", protectRoute, (req, res) => {
  userController.postAnnouncement(req, res)
})

router.put("/profile", protectRoute, (req, res) => {
  userController.updateProfile(req, res);
});

export default router;
