import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const app = express();

const localSpec = process.argv[2];
console.log("Local file for spec is", localSpec);

app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), "../../app")));
app.get("/openapi.json", (req, res) => {
  res.sendFile(localSpec);
});

app.listen(3000);
