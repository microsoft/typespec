// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public abstract class InputExampleValue
    {
        protected InputExampleValue(InputType type)
        {
            Type = type;
        }

        public InputType Type { get; }

        public static InputExampleValue Null(InputType type) => new InputExampleRawValue(type, null);
        public static InputExampleValue Value(InputType type, object? rawValue) => new InputExampleRawValue(type, rawValue);
        public static InputExampleValue List(InputType type, IReadOnlyList<InputExampleValue> values) => new InputExampleListValue(type, values);
        public static InputExampleValue Object(InputType type, IReadOnlyDictionary<string, InputExampleValue> properties) => new InputExampleObjectValue(type, properties);
        public static InputExampleValue Stream(InputType type, string filename) => new InputExampleStreamValue(type, filename);
    }
}
