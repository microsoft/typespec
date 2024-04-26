// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputApiKeyAuth : InputAuth
    {
        public InputApiKeyAuth(string name = "", string? prefix = null) : base()
        {
            Name = name;
            Prefix = prefix;
        }

        public string Name { get; internal set; }
        public string? Prefix { get; internal set; }
    }
}
