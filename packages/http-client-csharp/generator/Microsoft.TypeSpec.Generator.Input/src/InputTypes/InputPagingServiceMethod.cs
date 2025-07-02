// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents pagingservicemethod information.
    /// </summary>
    /// <summary>

    /// Gets the inputservicemethod.

    /// </summary>

    public class InputPagingServiceMethod : InputServiceMethod
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputPagingServiceMethod"/> class.
        /// </summary>
        public InputPagingServiceMethod(
            string name,
            string? accessibility,
            string[] apiVersions,
            string? documentation,
            string? summary,
            InputOperation operation,
            IReadOnlyList<InputParameter> parameters,
            InputServiceMethodResponse response,
            InputServiceMethodResponse? exception,
            bool isOverride,
            bool generateConvenient,
            bool generateProtocol,
            string crossLanguageDefinitionId,
            InputPagingServiceMetadata paging) : base(
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
            PagingMetadata = paging;
        }

        internal InputPagingServiceMethod() : this(
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
           new InputPagingServiceMetadata())
        { }        /// <summary>
        /// Gets the pagingmetadata.
        /// </summary>
        public InputPagingServiceMetadata PagingMetadata { get; internal set; }
    }
}
