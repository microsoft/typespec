// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDecoratorInfo
    {
        public InputDecoratorInfo(string name, IReadOnlyDictionary<string, BinaryData>? arguments)
        {
            Name = name;
            Arguments = arguments;
        }
        public string Name { get; }
        public IReadOnlyDictionary<string, BinaryData>? Arguments { get; }
    }
}
