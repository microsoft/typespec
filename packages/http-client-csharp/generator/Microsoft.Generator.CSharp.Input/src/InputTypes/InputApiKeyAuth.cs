// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputApiKeyAuth
    {
        public InputApiKeyAuth(string name, string? prefix)
        {
            Name = name;
            Prefix = prefix;
        }

        public string Name { get; }
        public string? Prefix { get; }
    }
}
