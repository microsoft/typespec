// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
