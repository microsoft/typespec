// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    public class CustomAncestor
    {
        protected static object DeserializePetsUnion(JsonElement element, ModelReaderWriterOptions options) => null;
        protected int SerializePetsUnion1 { get; set; }
    }

    public class CustomBase : CustomAncestor
    {
        protected int DeserializePetsUnion2;
    }

    public partial class Pet : CustomBase
    {
    }
}
