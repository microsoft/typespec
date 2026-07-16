import { Router } from "express";
import { AdminUrls } from "../constants.js";
import { logger } from "../logger.js";
import { isLoopbackAddress } from "../utils/network-utils.js";

const router = Router();

router.post(AdminUrls.stop, (req, res) => {
  // The stop endpoint terminates the server process and is intentionally
  // unauthenticated. To avoid an unauthenticated remote shutdown when the server
  // is bound to a public interface, only accept the signal from the local host.
  if (!isLoopbackAddress(req.socket.remoteAddress)) {
    logger.warn(
      `Rejected stop request from non-loopback address ${req.socket.remoteAddress ?? "unknown"}.`,
    );
    res.status(403).end();
    return;
  }

  logger.info("Received signal to stop server. Exiting...");
  res.status(202).end();
  setTimeout(() => {
    process.exit(0);
  });
});

export const adminRoutes: Router = router;
