import express from "express";
import { AuthController } from "../controllers/auth.controllers";

const router = express.Router();

router.post("/login", (req, res) => AuthController.Login(req, res));
router.post("/adduser", (req, res) => AuthController.AddUser(req, res));
router.post("/refresh", (req, res) => AuthController.RefreshToken(req, res));
router.post("/logout", (req, res) => AuthController.Logout(req, res));

export default router;
