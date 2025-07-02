// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents continuationtoken information.
    /// </summary>
    /// <summary>

    /// Gets the inputcontinuationtoken.

    /// </summary>

    public class InputContinuationToken
    {
        /// <summary>

        /// Gets the parameter.

        /// </summary>

        public InputParameter Parameter { get; }        /// <summary>
        /// Gets the responsesegments.
        /// </summary>
        public IReadOnlyList<string> ResponseSegments { get; }        /// <summary>
        /// Gets the responselocation.
        /// </summary>
        public InputResponseLocation ResponseLocation { get; }        /// <summary>
        /// Initializes a new instance of the <see cref="InputContinuationToken"/> class.
        /// </summary>
        public InputContinuationToken(InputParameter parameter, IReadOnlyList<string> responseSegments, InputResponseLocation responseLocation)
        {
            Parameter = parameter;
            ResponseSegments = responseSegments;
            ResponseLocation = responseLocation;
        }
    }
}
