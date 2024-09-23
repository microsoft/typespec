import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Azure.ClientGenerator.Core;

@@convenientAPI(Type.Property.Nullable.String.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.String.patchNull, false, "csharp");

@@convenientAPI(Type.Property.Nullable.Bytes.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.Bytes.patchNull, false, "csharp");

@@convenientAPI(Type.Property.Nullable.Datetime.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.Datetime.patchNull, false, "csharp");

@@convenientAPI(Type.Property.Nullable.Duration.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.Duration.patchNull, false, "csharp");

@@convenientAPI(Type.Property.Nullable.CollectionsByte.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.CollectionsByte.patchNull, false, "csharp");

@@convenientAPI(Type.Property.Nullable.CollectionsModel.patchNonNull, false, "csharp");
@@convenientAPI(Type.Property.Nullable.CollectionsModel.patchNull, false, "csharp");
