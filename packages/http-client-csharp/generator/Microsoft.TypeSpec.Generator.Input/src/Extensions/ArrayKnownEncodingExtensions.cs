// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class ArrayKnownEncodingExtensions
    {
        /// <summary>
        /// Converts ArrayKnownEncoding to SerializationFormat.
        /// </summary>
        public static SerializationFormat ToSerializationFormat(this ArrayKnownEncoding encoding)
        {
            return encoding switch
            {
                ArrayKnownEncoding.CommaDelimited => SerializationFormat.Array_CommaDelimited,
                ArrayKnownEncoding.SpaceDelimited => SerializationFormat.Array_SpaceDelimited,
                ArrayKnownEncoding.PipeDelimited => SerializationFormat.Array_PipeDelimited,
                ArrayKnownEncoding.NewlineDelimited => SerializationFormat.Array_NewlineDelimited,
                _ => throw new ArgumentOutOfRangeException(nameof(encoding), encoding, "Unknown array encoding")
            };
        }

        /// <summary>
        /// Get the delimiter string for array serialization format.
        /// </summary>
        public static bool TryGetDelimiter(SerializationFormat format, out string delimiter)
        {
            delimiter = format switch
            {
                SerializationFormat.Array_CommaDelimited => ",",
                SerializationFormat.Array_SpaceDelimited => " ",
                SerializationFormat.Array_PipeDelimited => "|",
                SerializationFormat.Array_NewlineDelimited => "\n",
                _ => null!
            };
            return delimiter != null;
        }
    }
}
