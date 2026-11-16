// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Text.Json;

namespace SampleTypeSpec
{
    public class DirectUnionAncestor
    {
        protected static object DeserializeDirectPetsUnion1(JsonElement element, ModelReaderWriterOptions options) => new object();
    }
}
