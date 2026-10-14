import { writeFileSync } from "node:fs";
import { createServer } from "node:http";

const [port, coverage] = process.argv.slice(2);
const server = createServer((request, response) => {
  if (request.url === "/.admin/stop" && request.method === "POST") {
    response.end("stopping", () => {
      server.close(() => {
        writeFileSync(coverage, "coverage flushed");
        process.exit(0);
      });
    });
  } else {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ server: "tsp-spector" }));
  }
});

setTimeout(() => server.listen(Number(port), "127.0.0.1"), 100);
