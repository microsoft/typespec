// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLroOperationIdPropertyMetadata : InputLroOperationIdMetadata
    {
        public InputLroOperationIdPropertyMetadata(InputModelProperty property, IReadOnlyList<InputModelProperty> propertySegments)
        {
            Property = property;
            PropertySegments = propertySegments;
        }

        public InputModelProperty Property { get; }
        public IReadOnlyList<InputModelProperty> PropertySegments { get; }
    }
}
