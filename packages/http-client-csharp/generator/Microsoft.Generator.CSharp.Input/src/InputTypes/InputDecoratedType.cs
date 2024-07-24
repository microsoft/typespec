// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp.Input.InputTypes
{
    public class InputDecoratedType
    {
        public InputDecoratedType(IReadOnlyList<InputDecoratorInfo> decorators)
        {
            Decorators = decorators;
        }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; }
    }
}
