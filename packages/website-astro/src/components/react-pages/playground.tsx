import { useEffect, useState } from "react";

import "@typespec/playground/styles.css";
import { type VersionData, loadImportMap } from "../playground-component/import-map";
import { LoadingSpinner } from "../playground-component/loading-spinner";

export const AsyncPlayground = () => {
  const [mod, setMod] = useState<{
    versionData: VersionData;
    WebsitePlayground: typeof import("../playground-component/playground").WebsitePlayground;
  }>(undefined as any);
  useEffect(() => {
    Promise.all([loadImportMap(), import("../playground-component/playground")])
      .then((x) => setMod({ versionData: x[0] as any, WebsitePlayground: x[1].WebsitePlayground }))
      .catch((e) => {
        throw e;
      });
  }, []);

  return mod ? (
    <mod.WebsitePlayground versionData={mod.versionData} />
  ) : (
    <LoadingSpinner message="Loading playground..." />
  );
};
