import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Azure.ClientGenerator.Core;

@@global.Azure.ClientGenerator.Core.clientNamespace(_Specs_.Azure.ClientGenerator.Core.AlternateType,
  "azure.clientgenerator.core.alternatetype",
  "java"
);

@@alternateType(_Specs_.Azure.ClientGenerator.Core.AlternateType.ExternalType.Feature,
  {
    identity: "geojson.Feature",
    package: "geojson",
    minVersion: "3.2.0",
  },
  "python"
);

@@alternateType(_Specs_.Azure.ClientGenerator.Core.AlternateType.ExternalType.Feature,
  {
    identity: "com.azure.core.models.GeoObject", // cSpell:ignore GeoObject
    package: "com.azure.core",
    minVersion: "1.14.0",
  },
  "java"
);

@@alternateType(_Specs_.Azure.ClientGenerator.Core.AlternateType.ExternalType.Feature,
  {
    identity: "NetTopologySuite.IO.GeoJSON.Feature",
    package: "NetTopologySuite.IO.GeoJSON",
    minVersion: "4.0.0",
  },
  "csharp"
);

@@alternateType(_Specs_.Azure.ClientGenerator.Core.AlternateType.ExternalType.Feature,
  {
    identity: "NetTopologySuite.IO.GeoJSON.Feature",
    package: "@types/geojson",
    minVersion: "7946.0.0",
  },
  "typescript"
);
