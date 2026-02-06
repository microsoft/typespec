// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Primitives
{
    public class ScmSerializationOptions : SerializationOptions
    {
        public ScmSerializationOptions(InputSerializationOptions inputSerializationOptions) : base()
        {
            Json = inputSerializationOptions.Json != null
                ? new(inputSerializationOptions.Json)
                : null;
            Xml = inputSerializationOptions.Xml != null
                ? new(inputSerializationOptions.Xml)
                : null;
        }

        public JsonSerialization? Json { get; }

        public XmlSerialization? Xml { get; }
    }
}
