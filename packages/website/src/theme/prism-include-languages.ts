import cadlPrismDefinition from "./cadl-lang-prism";

export default function prismIncludeLanguages(PrismObject) {
  PrismObject.languages.cadl = cadlPrismDefinition;
}
