const latestVersion = document.currentScript.getAttribute("data-latest-version");
const parsed = new URLSearchParams(window.location.search);

const requestedVersion = parsed.get("version");
const importMapUrl = `https://typespec.blob.core.windows.net/pkgs/indexes/typespec/${
  requestedVersion ?? latestVersion
}.json`;
const im = document.createElement("script");
im.type = "importmap-shim";
im.src = importMapUrl;
document.currentScript.after(im);

window.TSP_VERSION_DATA = {
  latest: latestVersion,
  requested: requestedVersion,
  resolved: requestedVersion ?? latestVersion,
};
