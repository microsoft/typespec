// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputOperationLink
    {
        public InputOperationLink(InputOperationLinkLocation location, InputModelProperty property)
        {
            Location = location;
            Property = property;
        }

        public InputOperationLinkLocation Location { get; }
        public InputModelProperty Property { get; }
    }
}
