import { useEffect, useState, type ReactNode } from "react";

import "@typespec/playground/styles.css";
import { FluentLayout } from "../layouts/fluent-layout";
import { loadImportMap, type VersionData } from "../playground-component/import-map";

export const AsyncPlayground = ({
  latestVersion,
  fallback,
}: {
  latestVersion: string;
  fallback?: ReactNode;
}) => {
  const [mod, setMod] = useState<{
    versionData: VersionData;
    WebsitePlayground: typeof import("../playground-component/playground").WebsitePlayground;
  }>(undefined as any);
  useEffect(() => {
    Promise.all([loadImportMap({ latestVersion }), import("../playground-component/playground")])
      .then((x) => setMod({ versionData: x[0] as any, WebsitePlayground: x[1].WebsitePlayground }))
      .catch((e) => {
        throw e;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FluentLayout style={{ height: "100%" }}>
      {mod ? <mod.WebsitePlayground versionData={mod.versionData} /> : fallback}
    </FluentLayout>
  );
};
