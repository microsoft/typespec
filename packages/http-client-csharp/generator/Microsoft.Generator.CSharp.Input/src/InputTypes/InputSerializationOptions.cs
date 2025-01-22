// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputSerializationOptions
    {
        public InputSerializationOptions(InputJsonSerializationOptions? json = null, InputXmlSerializationOptions? xml = null, InputMultipartOptions? multipart = null)
        {
            Json = json;
            Xml = xml;
            Multipart = multipart;
        }

        public InputJsonSerializationOptions? Json { get; init; }

        public InputXmlSerializationOptions? Xml { get; init; }

        public InputMultipartOptions? Multipart { get; init; }
    }
}
