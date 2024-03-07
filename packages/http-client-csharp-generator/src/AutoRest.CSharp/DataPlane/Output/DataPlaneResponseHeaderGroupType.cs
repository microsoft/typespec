// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Output.Models.Responses
{
    internal class DataPlaneResponseHeaderGroupType: TypeProvider
    {
        private static string[] _knownResponseHeaders = new[]
        {
            "Date",
            "ETag",
            "x-ms-client-request-id",
            "x-ms-request-id"
        };

        public DataPlaneResponseHeaderGroupType(InputOperation operation, OperationResponseHeader[] httpResponseHeaders, TypeFactory typeFactory, string clientPrefix, SourceInputModel? sourceInputModel)
            : base(Configuration.Namespace, sourceInputModel)
        {
            ResponseHeader CreateResponseHeader(OperationResponseHeader header)
            {
                CSharpType type = typeFactory.CreateType(header.Type);

                return new ResponseHeader(
                    header.Name.ToCleanName(),
                    header.NameInResponse,
                    type,
                    BuilderHelpers.EscapeXmlDocDescription(header.Description));
            }

            var operationName = operation.Name.ToCleanName();
            DefaultName = clientPrefix + operationName + "Headers";
            Description = $"Header model for {operationName}";
            Headers = httpResponseHeaders.Select(CreateResponseHeader).ToArray();
        }

        protected override string DefaultName { get; }
        public string Description { get; }
        public ResponseHeader[] Headers { get; }
        protected override string DefaultAccessibility { get; } = "internal";

        public static DataPlaneResponseHeaderGroupType? TryCreate(InputOperation operation, TypeFactory typeFactory, string clientPrefix, SourceInputModel? sourceInputModel)
        {
            var operationResponseHeaders = operation.Responses.SelectMany(r => r.Headers)
                .Where(h => !_knownResponseHeaders.Contains(h.NameInResponse, StringComparer.InvariantCultureIgnoreCase))
                .GroupBy(h => h.NameInResponse)
                // Take first header definition with any particular name
                .Select(h => h.First())
                .ToArray();

            if (!operationResponseHeaders.Any())
            {
                return null;
            }

            return new DataPlaneResponseHeaderGroupType(operation, operationResponseHeaders, typeFactory, clientPrefix, sourceInputModel);
        }
    }
}
