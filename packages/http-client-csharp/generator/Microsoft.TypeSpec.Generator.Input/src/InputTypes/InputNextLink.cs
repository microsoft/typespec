// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents nextlink information.
    /// </summary>
    /// <summary>

    /// Gets the inputnextlink.

    /// </summary>

    public class InputNextLink
    {
        /// <summary>

        /// Gets the operation.

        /// </summary>

        public InputOperation? Operation { get; }        /// <summary>
        /// Gets the responsesegments.
        /// </summary>
        public IReadOnlyList<string> ResponseSegments { get; }        /// <summary>
        /// Gets the responselocation.
        /// </summary>
        public InputResponseLocation ResponseLocation { get; }        /// <summary>
        /// Gets the reinjectedparameters.
        /// </summary>
        public IReadOnlyList<InputParameter>? ReInjectedParameters { get; }        /// <summary>
        /// Initializes a new instance of the <see cref="InputNextLink"/> class.
        /// </summary>
        public InputNextLink(
            InputOperation? operation,
            IReadOnlyList<string> responseSegments,
            InputResponseLocation responseLocation,
            IReadOnlyList<InputParameter>? reInjectedParameters)
        {
            Operation = operation;
            ResponseSegments = responseSegments;
            ResponseLocation = responseLocation;
            ReInjectedParameters = reInjectedParameters;
        }
    }
}
