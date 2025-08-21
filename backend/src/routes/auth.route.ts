import express from "express";
import { AuthController } from "../controllers/auth.controllers";

const router = express.Router();

router.post("/login", AuthController.Login);
router.post("/adduser", AuthController.AddUser);
router.post("/refresh", AuthController.RefreshToken);
router.post("/logout", AuthController.Logout);

export default router;
