// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumTypeValue
    {
        public InputEnumTypeValue(string name, string? description)
        {
            Name = name;
            Description = description;
        }

        public string Name { get; }
        public string? Description { get; }
    }
}
