export interface NodeModuleSpecifier {
  readonly packageName: string;
  readonly subPath: string;
}
// returns the imported package name for bare module imports
export function parseNodeModuleSpecifier(id: string): NodeModuleSpecifier | null {
  if (id.startsWith(".") || id.startsWith("/")) {
    return null;
  }

  const split = id.split("/");

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === "@") {
    return { packageName: `${split[0]}/${split[1]}`, subPath: split.slice(2).join("/") };
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return { packageName: split[0], subPath: split.slice(1).join("/") };
}
