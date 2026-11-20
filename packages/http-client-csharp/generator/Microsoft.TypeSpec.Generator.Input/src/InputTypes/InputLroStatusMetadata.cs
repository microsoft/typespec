// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLroStatusMetadata
    {
        public InputLroStatusMetadata(InputModelProperty property, IReadOnlyList<InputModelProperty> propertySegments)
        {
            Property = property;
            PropertySegments = propertySegments;
        }

        public InputModelProperty Property { get; }
        /// <summary>
        /// Typed access path from the polling response model, not the final result.
        /// </summary>
        public IReadOnlyList<InputModelProperty> PropertySegments { get; }
    }
}
