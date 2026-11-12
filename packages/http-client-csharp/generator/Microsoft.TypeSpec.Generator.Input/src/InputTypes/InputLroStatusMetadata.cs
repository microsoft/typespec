// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Auxiliary values selected from the latest received status-monitor response, including failed or canceled responses.
    /// Values are not persisted in continuation tokens and may be absent until a response is received.
    /// </summary>
    public sealed class InputLroStatusMetadata
    {
        public InputLroStatusMetadata(InputModelProperty property, IReadOnlyList<InputModelProperty> propertySegments)
        {
            Property = property;
            PropertySegments = propertySegments;
        }

        public InputModelProperty Property { get; }
        /// <summary>Typed property path rooted at the status-monitor response model.</summary>
        public IReadOnlyList<InputModelProperty> PropertySegments { get; }
    }
}
