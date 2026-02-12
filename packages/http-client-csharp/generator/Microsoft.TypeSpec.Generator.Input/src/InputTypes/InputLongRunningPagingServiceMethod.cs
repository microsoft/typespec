// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputLongRunningPagingServiceMethod : InputServiceMethod
    {
        public InputLongRunningPagingServiceMethod(
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
            InputLongRunningServiceMetadata lroMetadata,
            InputPagingServiceMetadata pagingMetadata) : base(
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
            LongRunningServiceMetadata = lroMetadata;
            PagingMetadata = pagingMetadata;
        }

        internal InputLongRunningPagingServiceMethod() : this(
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
           new InputLongRunningServiceMetadata(),
           new InputPagingServiceMetadata())
        { }

        public InputLongRunningServiceMetadata LongRunningServiceMetadata { get; internal set; }
        public InputPagingServiceMetadata PagingMetadata { get; internal set; }
    }
}
