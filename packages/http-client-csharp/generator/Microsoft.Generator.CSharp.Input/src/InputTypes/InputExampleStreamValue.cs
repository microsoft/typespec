// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
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
