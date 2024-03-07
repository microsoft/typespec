import siteConfig from "@generated/docusaurus.config";
import typespecPrismDefinition from "./typespec-lang-prism";

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: { prism },
  } = siteConfig;
  const { additionalLanguages } = prism as any;

  globalThis.Prism = PrismObject;
  additionalLanguages.forEach((lang) => {
    require(`prismjs/components/prism-${lang}`);
  });
  delete globalThis.Prism;

  PrismObject.languages.tsp = typespecPrismDefinition;
  PrismObject.languages.typespec = typespecPrismDefinition;
}
