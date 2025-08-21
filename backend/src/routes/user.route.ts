import express from "express";
import { userController } from "../controllers/user.controllers";
import { protectRoute, requireRole } from "../middleware/middleware";

const router = express.Router();

router.get("/me", protectRoute,
  userController.getCurrentUser);

router.get("/dashboard/stats", protectRoute,
  userController.getDashboardStats
);

router.get("/teacher", protectRoute, requireRole("TEACHER"),
  userController.getTeacherDashboard);

router.get("/announcements", protectRoute,
  userController.getAnnouncements);

router.post("/post/announcement", protectRoute,
  userController.postAnnouncement
)

router.put("/profile", protectRoute,
  userController.updateProfile);

export default router;
