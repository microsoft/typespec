import express from "express";
import fs from "fs";
import swagerUiDist from "swagger-ui-dist";
const pathToSwaggerUi = swagerUiDist.absolutePath();
const app = express();

const localSpec = process.argv[2];
console.log("Local file for spec is", localSpec);

const indexContent = fs
  .readFileSync(`${pathToSwaggerUi}/index.html`)
  .toString()
  .replace("https://petstore.swagger.io/v2/swagger.json", "http://localhost:3000/openapi.json");

app.get("/", (req, res) => res.send(indexContent));
app.get("/index.html", (req, res) => res.send(indexContent)); // you need to do this since the line below serves `index.html` at both routes
app.use(express.static(pathToSwaggerUi));

app.get("/openapi.json", (req, res) => {
  res.sendFile(localSpec);
});

app.listen(3000);
