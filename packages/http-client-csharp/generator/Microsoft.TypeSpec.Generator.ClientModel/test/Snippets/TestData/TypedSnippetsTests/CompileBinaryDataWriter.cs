// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text;
using System.Text.Json;

namespace Sample
{
    internal static class ModelSerializationExtensions
    {
        internal static readonly JsonDocumentOptions JsonDocumentOptions = /* json document options */;
    }

    public static class BinaryDataWriter
    {
        public static string Write(string json)
        {
            var value = BinaryData.FromString(json);
            using var stream = new MemoryStream();
            using var writer = new Utf8JsonWriter(stream);
            /* write binary data */
            writer.Flush();
            return Encoding.UTF8.GetString(stream.ToArray());
        }
    }
}
