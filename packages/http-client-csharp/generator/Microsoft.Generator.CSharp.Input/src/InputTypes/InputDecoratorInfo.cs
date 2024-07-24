// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input.InputTypes
{
    public class InputDecoratorInfo
    {
        public InputDecoratorInfo(string name, IReadOnlyDictionary<string, object> arguments)
        {
            Name = name;
            Arguments = arguments;
        }
        public string Name { get; }
        public IReadOnlyDictionary<string, object> Arguments { get; }
    }
}
