import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEffect, useState } from "react";

import "@typespec/playground/style.css";
import { FluentLayout } from "../components/fluent-layout/fluent-layout";
import { VersionData, loadImportMap } from "../components/playground-component/import-map";

export default function PlaygroundPage() {
  return (
    <BrowserOnly>
      {() => {
        return (
          <FluentLayout>
            <div style={{ height: "calc(100vh - var(--ifm-navbar-height))", width: "100%" }}>
              <AsyncPlayground />
            </div>
          </FluentLayout>
        );
      }}
    </BrowserOnly>
  );
}

const AsyncPlayground = () => {
  const [mod, setMod] = useState<{
    versionData: VersionData;
    WebsitePlayground: typeof import("../components/playground-component/playground").WebsitePlayground;
  }>(undefined);
  useEffect(() => {
    Promise.all([loadImportMap(), import("../components/playground-component/playground")])
      .then((x) => setMod({ versionData: x[0], WebsitePlayground: x[1].WebsitePlayground }))
      .catch((e) => {
        throw e;
      });
  }, []);

  return mod && <mod.WebsitePlayground versionData={mod.versionData} />;
};
