import typespecPrismDefinition from "./typespec-lang-prism";

export default function prismIncludeLanguages(PrismObject) {
  PrismObject.languages.tsp = typespecPrismDefinition;
  PrismObject.languages.typespec = typespecPrismDefinition;
}
