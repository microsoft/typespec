import { execa } from "execa";

console.log("Check executable is running");

async function main() {
  const result = await execa`dist/standalone-test --help`;
  if (result.stdout.includes("TypeSpec compiler v") && result.stdout.includes("tsp <command>")) {
    console.log("Executable is working");
  } else {
    console.error("Executable is not working");
    console.error(result.stdout);
    console.error("Std err----------------");
    console.error(result.stderr);
    process.exit(1);
  }
}
