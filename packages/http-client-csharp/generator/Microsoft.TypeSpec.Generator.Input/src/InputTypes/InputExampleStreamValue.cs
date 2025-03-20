// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputExampleStreamValue : InputExampleValue
    {
        public InputExampleStreamValue(InputType type, string filename) : base(type)
        {
            Filename = filename;
        }

        public string Filename { get; }
    }
}
