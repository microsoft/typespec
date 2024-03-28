// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input.Examples
{
    internal abstract record InputExampleValue(InputType Type)
    {
        public static InputExampleValue Null(InputType type) => new InputExampleRawValue(type, null);
        public static InputExampleValue Value(InputType type, object? rawValue) => new InputExampleRawValue(type, rawValue);
        public static InputExampleValue List(InputType type, IReadOnlyList<InputExampleValue> values) => new InputExampleListValue(type, values);
        public static InputExampleValue Object(InputType type, IReadOnlyDictionary<string, InputExampleValue> properties) => new InputExampleObjectValue(type, properties);
        public static InputExampleValue Stream(InputType type, string filename) => new InputExampleStreamValue(type, filename);
    }

    internal record InputExampleRawValue(InputType Type, object? RawValue) : InputExampleValue(Type);

    internal record InputExampleListValue(InputType Type, IReadOnlyList<InputExampleValue> Values) : InputExampleValue(Type);

    internal record InputExampleObjectValue(InputType Type, IReadOnlyDictionary<string, InputExampleValue> Values): InputExampleValue(Type);

    internal record InputExampleStreamValue(InputType Type, string Filename): InputExampleValue(Type);
}
