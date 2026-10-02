interface PackageManifest {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export const hooks = {
  readPackage(pkg: PackageManifest): PackageManifest {
    if (
      pkg.name === "typedoc" ||
      pkg.name === "@astrojs/check" ||
      pkg.name === "@astrojs/language-server"
    ) {
      // Documentation tooling needs the JS compiler API, not the workspace's native TypeScript peer.
      pkg.dependencies = { ...pkg.dependencies, typescript: "~6.0.2" };
      delete pkg.peerDependencies?.typescript;
    }
    return pkg;
  },
};
