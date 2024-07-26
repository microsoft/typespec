// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.ClientModel.Primitives
{
    internal sealed class ApiVersion
    {
        public string Name { get; }
        public FormattableString Description { get; }
        public int Value { get; }
        public string StringValue { get; }

        public ApiVersion(string name, FormattableString description, int value, string stringValue)
        {
            Name = name;
            Description = description;
            Value = value;
            StringValue = stringValue;
        }
    }
}
