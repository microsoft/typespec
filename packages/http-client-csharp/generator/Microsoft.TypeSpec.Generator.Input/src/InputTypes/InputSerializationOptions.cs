// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputSerializationOptions
    {
        public InputSerializationOptions(InputJsonSerializationOptions? json = null, InputXmlSerializationOptions? xml = null, InputMultipartOptions? multipart = null)
        {
            Json = json;
            Xml = xml;
            Multipart = multipart;
        }

        public InputJsonSerializationOptions? Json { get; internal set; }

        public InputXmlSerializationOptions? Xml { get; internal set; }

        public InputMultipartOptions? Multipart { get; internal set; }
    }
}
