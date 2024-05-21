// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputExampleObjectValue : InputExampleValue
    {
        public InputExampleObjectValue(InputType type, IReadOnlyDictionary<string, InputExampleValue> values) : base(type)
        {
            Values = values;
        }

        public IReadOnlyDictionary<string, InputExampleValue> Values { get; }
    }
}
