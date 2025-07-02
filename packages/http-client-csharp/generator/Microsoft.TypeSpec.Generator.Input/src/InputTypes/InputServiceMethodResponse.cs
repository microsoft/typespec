// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents servicemethodresponse information.
    /// </summary>
    /// <summary>

    /// Gets the inputservicemethodresponse.

    /// </summary>

    public class InputServiceMethodResponse
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputServiceMethodResponse"/> class.
        /// </summary>
        public InputServiceMethodResponse(InputType? type, IReadOnlyList<string>? resultSegments)
        {
            Type = type;
            ResultSegments = resultSegments;
        }        /// <summary>
        /// Gets the  type.
        /// </summary>
        public InputType? Type { get; internal set; }        /// <summary>
        /// Gets the resultsegments.
        /// </summary>
        public IReadOnlyList<string>? ResultSegments { get; internal set; }

        internal InputServiceMethodResponse() : this(null, null) { }
    }
}
