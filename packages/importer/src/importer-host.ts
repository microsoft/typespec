import { NodeHost, type CompilerHost } from "@typespec/compiler";
import { createRemoteHost } from "./remote-host.js";

/**
 * Special host that tries to load data from additional locations
 */
export const ImporterHost: CompilerHost = {
  ...NodeHost,
  ...createRemoteHost(NodeHost),
};
