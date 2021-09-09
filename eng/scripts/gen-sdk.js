import { run, scanSwaggers, autorest } from "./helpers.js";

function generateSDK(lang, swagger) {
  try {
    switch (lang) {
      case "python":
        run(autorest, [
          "--debug",
          "--verbose",
          "--version=3.4.5",
          "--python",
          "--track2",
          "--use=@autorest/python@5.8.1",
          "--python-sdks-folder=sdk/python",
          "--python-mode=update",
          "--input-file=" + swagger,
        ]);

        break;
      case "javascript":
        run(autorest, [
          "--typescript",
          "--use=@autorest/typescript@6.0.0-beta.10",
          "--azure-arm",
          "--generate-metadata",
          "--output-folder=sdk/javascript",
          "--modelerfour.lenient-model-deduplication",
          "--head-as-boolean=true",
          "--license-header=MICROSOFT_MIT_NO_VERSION",
          "--input-file=" + swagger,
        ]);
        break;
      default:
        throw new Error("Not supported SDK language: " + lang);
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function main() {
  const lang = process.argv[2]; // python/javascript
  const roots = process.argv[3].split(";");
  const paths = roots.flatMap((root) => scanSwaggers(root));
  console.log("Scanned following swaggers:", paths);
  const errorPaths = [];
  for (const p of paths) {
    console.log("Generate SDK for", p);
    const success = await generateSDK(lang, p);
    if (!success) {
      errorPaths.push(p);
    }
    console.log("\n\n\n");
  }
  if (errorPaths.length > 0) {
    console.error("SDK generation errors for following swagger files:");
    console.error(errorPaths);
    process.exit(1);
  }
}

main();
