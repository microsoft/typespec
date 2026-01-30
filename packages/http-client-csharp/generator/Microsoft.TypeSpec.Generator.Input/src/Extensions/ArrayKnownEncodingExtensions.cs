// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class ArrayKnownEncodingExtensions
    {
        /// <summary>
        /// Converts a string representation to ArrayKnownEncoding.
        /// </summary>
        public static bool TryParse(string? value, out ArrayKnownEncoding encoding)
        {
            encoding = default;
            if (value == null) return false;

            return value switch
            {
                "ArrayEncoding.commaDelimited" or "commaDelimited" =>
                    SetEncodingAndReturnTrue(out encoding, ArrayKnownEncoding.CommaDelimited),
                "ArrayEncoding.spaceDelimited" or "spaceDelimited" =>
                    SetEncodingAndReturnTrue(out encoding, ArrayKnownEncoding.SpaceDelimited),
                "ArrayEncoding.pipeDelimited" or "pipeDelimited" =>
                    SetEncodingAndReturnTrue(out encoding, ArrayKnownEncoding.PipeDelimited),
                "ArrayEncoding.newlineDelimited" or "newlineDelimited" =>
                    SetEncodingAndReturnTrue(out encoding, ArrayKnownEncoding.NewlineDelimited),
                _ => false
            };
        }

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
                _ => string.Empty
            };
            return !string.IsNullOrEmpty(delimiter);
        }

        private static bool SetEncodingAndReturnTrue(out ArrayKnownEncoding encoding, ArrayKnownEncoding value)
        {
            encoding = value;
            return true;
        }
    }
}
