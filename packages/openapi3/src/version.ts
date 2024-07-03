let version;
try {
  // eslint-disable-next-line
  // @ts-ignore
  version = (await import("../version.js")).version;
} catch {
  const name = "../dist/version.js";
  version = (await import(/* @vite-ignore */ /* webpackIgnore: true */ name)).default;
}

export const packageVersion = version;
