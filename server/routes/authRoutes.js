import { Router } from "express";
import {
  getAuthStatus,
  verifyAdminPassword,
  setupAdminPassword,
} from "../controllers/authController.js";

const router = Router();

router.get("/status", getAuthStatus);
router.post("/verify", verifyAdminPassword);
router.post("/setup", setupAdminPassword);

export default router;
