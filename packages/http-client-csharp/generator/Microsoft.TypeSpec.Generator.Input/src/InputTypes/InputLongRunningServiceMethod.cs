// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputLongRunningServiceMethod : InputServiceMethod
    {
        public InputLongRunningServiceMethod(
            string name,
            string? accessibility,
            string[] apiVersions,
            string? documentation,
            string? summary,
            InputOperation operation,
            IReadOnlyList<InputMethodParameter> parameters,
            InputServiceMethodResponse response,
            InputServiceMethodResponse? exception,
            bool isOverride,
            bool generateConvenient,
            bool generateProtocol,
            string crossLanguageDefinitionId,
            InputLongRunningServiceMetadata longRunningServiceMetadata) : base(
                name,
                accessibility,
                apiVersions,
                documentation,
                summary,
                operation,
                parameters,
                response,
                exception,
                isOverride,
                generateConvenient,
                generateProtocol,
                crossLanguageDefinitionId)
        {
            LongRunningServiceMetadata = longRunningServiceMetadata;
        }

        internal InputLongRunningServiceMethod() : this(
           string.Empty,
           string.Empty,
           [],
           string.Empty,
           string.Empty,
           new InputOperation(),
           [],
           new InputServiceMethodResponse(),
           null,
           false,
           false,
           false,
           string.Empty,
           new InputLongRunningServiceMetadata())
        { }

        public InputLongRunningServiceMetadata LongRunningServiceMetadata { get; internal set; }
    }
}
