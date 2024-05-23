// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputExampleListValue : InputExampleValue
    {
        public InputExampleListValue(InputType type, IReadOnlyList<InputExampleValue> values) : base(type)
        {
            Values = values;
        }

        public IReadOnlyList<InputExampleValue> Values { get; }
    }
}
