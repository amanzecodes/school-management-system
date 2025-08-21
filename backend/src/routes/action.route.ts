import express from "express"
import { ActionController } from "../controllers/action.controllers";

const router = express.Router()

router.post("single/:id", ActionController.SingleUpload)

export default router;