// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample
{
    internal static class ModelSerializationExtensions
    {
        public static ModelReaderWriterOptions WireOptions => SampleTypeSpec.ModelSerializationExtensions.WireOptions;
        public static JsonDocumentOptions JsonDocumentOptions => SampleTypeSpec.ModelSerializationExtensions.JsonDocumentOptions;
    }
}

namespace SampleTypeSpec
{
    internal static class SampleContext
    {
        public static SampleTypeSpecContext Default => SampleTypeSpecContext.Default;
    }
}
