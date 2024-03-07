// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using NJsonSchema;

namespace AutoRest.CodeModel
{
    internal class CustomTypeNameGenerator : DefaultTypeNameGenerator
    {
        // Class names that conflict with project class names
        private static readonly Dictionary<string, string> RenameMap = new Dictionary<string, string>
        {
            { "HttpHeader", "HttpResponseHeader" },
            { "Parameter", "RequestParameter" },
            { "Request", "ServiceRequest" },
            { "Response", "ServiceResponse" },
            { "SerializationFormat", "SerializationFormatMetadata" }
        };

        public override string Generate(JsonSchema schema, string typeNameHint, IEnumerable<string> reservedTypeNames)
        {
            if (RenameMap.ContainsKey(typeNameHint))
            {
                typeNameHint = RenameMap[typeNameHint];
            }
            return base.Generate(schema, typeNameHint, reservedTypeNames);
        }
    }
}
