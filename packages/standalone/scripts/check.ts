import { execa } from "execa";

await main();

async function main() {
  const exe = process.platform === "win32" ? "tsp.exe" : "tsp";
  console.log(`Checking ${exe} is running`);
  const result = await execa`dist/${exe} --help`;
  if (result.stdout.includes("tsp <command>")) {
    console.log("✅ working!");
  } else {
    console.error("Executable is not working");
    console.error(result.stdout);
    console.error("Std err----------------");
    console.error(result.stderr);
    process.exit(1);
  }
}
