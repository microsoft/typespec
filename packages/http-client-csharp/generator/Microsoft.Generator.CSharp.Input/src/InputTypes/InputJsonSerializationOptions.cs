// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputJsonSerializationOptions
    {
        public InputJsonSerializationOptions(string name)
        {
            Name = name;
        }

        public string Name { get; internal set; }
    }
}
