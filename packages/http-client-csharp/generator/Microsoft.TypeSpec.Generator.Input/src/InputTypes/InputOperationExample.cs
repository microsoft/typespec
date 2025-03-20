// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputOperationExample
    {
        public InputOperationExample(InputOperation operation, IReadOnlyList<InputParameterExample> parameters)
        {
            Operation = operation;
            Parameters = parameters;
        }

        public InputOperation Operation { get; }
        public IReadOnlyList<InputParameterExample> Parameters { get; }
    }
}
