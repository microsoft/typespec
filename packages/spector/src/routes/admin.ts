import { Router } from "express";
import { AdminUrls, SPECTOR_SERVER_ID } from "../constants.js";
import { logger } from "../logger.js";

const router = Router();

router.get(AdminUrls.health, (_req, res) => {
  res.status(200).json({ server: SPECTOR_SERVER_ID });
});

router.post(AdminUrls.stop, (_req, res) => {
  logger.info("Received signal to stop server. Exiting...");
  res.status(202).end();
  setTimeout(() => {
    process.exit(0);
  });
});

export const adminRoutes: Router = router;
