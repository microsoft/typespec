import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEffect, useState } from "react";

import "@typespec/playground/style.css";
import { FluentLayout } from "../components/fluent-layout/fluent-layout";
import { loadImportMap } from "../components/playground-component/import-map";

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
  const [mod, setMod] = useState<
    typeof import("../components/playground-component/playground") | null
  >(null);
  useEffect(() => {
    Promise.all([loadImportMap(), import("../components/playground-component/playground")])
      .then((x) => setMod(x[1]))
      .catch((e) => {
        throw e;
      });
  }, []);

  return mod && <mod.WebsitePlayground />;
};
