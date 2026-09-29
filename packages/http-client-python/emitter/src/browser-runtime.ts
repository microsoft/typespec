import pkgJson from "../../package.json" with { type: "json" };
import { BLOB_STORAGE_BASE_URL, PACKAGE_NAME, PYGEN_WHEEL_FILENAME } from "./constants.js";
import type { PyodideInterface } from "./pyodide-loader.js";
import { loadPyodide } from "./pyodide-loader.js";

export async function setupPyodideCallBrowser(): Promise<PyodideInterface> {
  const assetsUrl = `${BLOB_STORAGE_BASE_URL}/${PACKAGE_NAME}/${pkgJson.version}/generator/dist`;
  const pyodide = await loadPyodide({
    indexURL: `${assetsUrl}/pyodide/`,
  });

  pyodide.FS.mkdirTree("/generator");
  const response = await fetch(`${assetsUrl}/browser-wheels.json`);
  if (!response.ok) {
    throw new Error(`Failed to load browser Python wheels: ${response.status}`);
  }
  const manifest: unknown = await response.json();
  const isWheelList = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (name) =>
        typeof name === "string" && /^[A-Za-z0-9_]+-[A-Za-z0-9_.-]+-py3-none-any\.whl$/.test(name),
    );
  const generatorWheels =
    typeof manifest === "object" && manifest !== null && "generator" in manifest
      ? manifest.generator
      : undefined;
  const pyodideWheels =
    typeof manifest === "object" && manifest !== null && "pyodide" in manifest
      ? manifest.pyodide
      : undefined;
  if (
    !isWheelList(generatorWheels) ||
    !isWheelList(pyodideWheels) ||
    pyodideWheels.length !== 5 ||
    !["packaging", "micropip", "click", "pyyaml", "markupsafe"].every((name, index) =>
      pyodideWheels[index].startsWith(`${name}-`),
    )
  ) {
    throw new Error("Invalid browser Python wheel manifest");
  }

  const pyodideWheelUrls = pyodideWheels.map((name) => `${assetsUrl}/pyodide-wheels/${name}`);
  await pyodide.loadPackage(pyodideWheelUrls.slice(0, 2));

  const globals = pyodide.toPy({
    pyodideWheelUrls: pyodideWheelUrls.slice(2),
    wheelUrls: generatorWheels.map((name) => `${assetsUrl}/browser-wheels/${name}`),
    generatorWheelUrl: `${assetsUrl}/${PYGEN_WHEEL_FILENAME}`,
  });
  try {
    await pyodide.runPythonAsync(
      `import micropip
await micropip.install(pyodideWheelUrls, deps=False)
await micropip.install(wheelUrls, deps=False)
await micropip.install(generatorWheelUrl, deps=False)`,
      { globals },
    );
  } finally {
    globals.destroy();
  }
  return pyodide;
}
