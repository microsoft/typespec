import BrowserOnly from "@docusaurus/BrowserOnly";
import Layout from "@theme/Layout";
import { useState } from "react";
export default function PlaygroundPage() {
  return (
    <BrowserOnly>
      {() => {
        return (
          <Layout>
            <AsyncPlayground />
          </Layout>
        );
      }}
    </BrowserOnly>
  );
}

const AsyncPlayground = () => {
  const [mod, setMod] = useState<any | undefined>();
  import("../components/playground-component")
    .then((x) => setMod(x))
    .catch((e) => {
      throw e;
    });

  return mod && <mod.WebsitePlayground />;
};
