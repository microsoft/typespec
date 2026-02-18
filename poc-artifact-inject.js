const fs = require("fs");
const path = require("path");

const dir = path.join(process.cwd(), "comment-out");
fs.mkdirSync(dir, { recursive: true });

fs.copyFileSync(
  path.join(process.cwd(), "poc-check.sh"),
  path.join(dir, "poc-check.sh")
);

fs.writeFileSync(
  path.join(dir, "package.json"),
  JSON.stringify(
    {
      name: "typespec-poc",
      version: "0.0.0-poc",
      private: true,
      scripts: {
        preinstall: "bash poc-check.sh",
      },
    },
    null,
    2
  )
);
