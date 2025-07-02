// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents longrunningservicemethod information.
    /// </summary>
    /// <summary>

    /// Gets the inputservicemethod.

    /// </summary>

    public class InputLongRunningServiceMethod : InputServiceMethod
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputLongRunningServiceMethod"/> class.
        /// </summary>
        public InputLongRunningServiceMethod(
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
        { }        /// <summary>
        /// Gets the longrunningservicemetadata.
        /// </summary>
        public InputLongRunningServiceMetadata LongRunningServiceMetadata { get; internal set; }
    }
}
