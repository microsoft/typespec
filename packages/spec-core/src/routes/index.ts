import { Router } from "express";
import { adminRoutes } from "./admin.js";

const router = Router();
router.use("/", adminRoutes);

export const internalRouter: Router = router;
