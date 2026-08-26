export const AdminUrls = {
  stop: "/.admin/stop",
  health: "/.admin/health",
};

/**
 * Value returned by the health endpoint. Used to tell an actual mock server apart from
 * an unrelated process that happens to be listening on the same port.
 */
export const SPECTOR_SERVER_ID = "tsp-spector";
