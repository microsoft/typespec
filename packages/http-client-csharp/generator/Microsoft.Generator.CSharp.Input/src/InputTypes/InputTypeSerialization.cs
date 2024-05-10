// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputTypeSerialization
    {
        public InputTypeSerialization(bool json, InputTypeXmlSerialization? xml, bool includeConverter)
        {
            Json = json;
            Xml = xml;
            IncludeConverter = includeConverter;
        }

        public bool Json { get; }
        public InputTypeXmlSerialization? Xml { get; }
        public bool IncludeConverter { get; }

        public static InputTypeSerialization Default { get; } = new(true, null, false);
    }
}
