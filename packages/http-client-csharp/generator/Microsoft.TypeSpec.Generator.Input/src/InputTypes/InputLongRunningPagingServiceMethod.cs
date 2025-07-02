// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents longrunningpagingservicemethod information.
    /// </summary>
    /// <summary>

    /// Gets the inputservicemethod.

    /// </summary>

    public class InputLongRunningPagingServiceMethod : InputServiceMethod
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputLongRunningPagingServiceMethod"/> class.
        /// </summary>
        public InputLongRunningPagingServiceMethod(
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
        { }        /// <summary>
        /// Gets the longrunningservicemetadata.
        /// </summary>
        public InputLongRunningServiceMetadata LongRunningServiceMetadata { get; internal set; }        /// <summary>
        /// Gets the pagingmetadata.
        /// </summary>
        public InputPagingServiceMetadata PagingMetadata { get; internal set; }
    }
}
