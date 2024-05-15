// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputTypeSerialization
    {
        public InputTypeSerialization(bool json, InputTypeXmlSerialization? xml)
        {
            Json = json;
            Xml = xml;
        }

        public bool Json { get; }
        public InputTypeXmlSerialization? Xml { get; }

        public static InputTypeSerialization Default { get; } = new(true, null);
    }
}
