// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal static class Utf8JsonReaderExtensions
    {
        public static bool TryReadReferenceId(this ref Utf8JsonReader reader, ref string? id)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != "$id")
            {
                return false;
            }

            reader.Read();
            id = reader.GetString() ?? throw new JsonException();
            reader.Read();
            return true;
        }

        public static bool TryReadReferenceId(this ref Utf8JsonReader reader, ref bool isFirstProperty, ref string? value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != "$id")
            {
                return false;
            }

            if (!isFirstProperty)
            {
                throw new JsonException("$id should be the first defined property");
            }

            isFirstProperty = false;

            reader.Read();
            value = reader.GetString() ?? throw new JsonException();
            reader.Read();
            return true;
        }

        public static bool TryReadBoolean(this ref Utf8JsonReader reader, string propertyName, ref bool value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            value = reader.GetBoolean();
            reader.Read();
            return true;
        }

        public static bool TryReadInt32(this ref Utf8JsonReader reader, string propertyName, ref int value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            value = reader.GetInt32();
            reader.Read();
            return true;
        }

        public static bool TryReadString(this ref Utf8JsonReader reader, string propertyName, ref string? value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            value = reader.GetString() ?? throw new JsonException();
            reader.Read();
            return true;
        }

        public static bool TryReadEnumValue(this ref Utf8JsonReader reader, string propertyName, ref object? value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            switch (reader.TokenType)
            {
                case JsonTokenType.String:
                    value = reader.GetString() ?? throw new JsonException("Enum value cannot be empty");
                    break;
                case JsonTokenType.Number:
                    if (reader.TryGetInt32(out int intValue))
                    {
                        value = intValue;
                    }
                    else if (reader.TryGetSingle(out float floatValue))
                    {
                        value = floatValue;
                    }
                    else
                    {
                        throw new JsonException($"Unsupported enum value type: {reader.TokenType}");
                    }
                    break;
                default:
                    throw new JsonException($"Unsupported enum value type: {reader.TokenType}");
            }

            reader.Read();
            return true;
        }

        public static bool TryReadWithConverter<T>(this ref Utf8JsonReader reader, string propertyName, JsonSerializerOptions options, ref T? value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            value = reader.ReadWithConverter<T>(options);
            return true;
        }

        public static bool TryReadWithConverter<T>(this ref Utf8JsonReader reader, string propertyName, JsonSerializerOptions options, ref IReadOnlyList<T>? value)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            var result = new List<T>();
            if (reader.TokenType != JsonTokenType.StartArray)
            {
                throw new JsonException();
            }
            reader.Read();
            while (reader.TokenType != JsonTokenType.EndArray)
            {
                var item = reader.ReadWithConverter<T>(options);
                result.Add(item ?? throw new JsonException());
            }
            reader.Read();
            value = result;
            return true;
        }

        public static T? ReadWithConverter<T>(this ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            var converter = (JsonConverter<T>)options.GetConverter(typeof(T));
            var value = converter.Read(ref reader, typeof(T), options);
            reader.Read();
            return value;
        }

        public static T? ReadReferenceAndResolve<T>(this ref Utf8JsonReader reader, ReferenceResolver resolver) where T : class
        {
            if (reader.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException();
            }
            reader.Read();

            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != "$ref")
            {
                return null;
            }

            reader.Read();
            var idRef = reader.GetString() ?? throw new JsonException("$ref can't be null");
            var result = (T)resolver.ResolveReference(idRef);

            reader.Read();
            if (reader.TokenType != JsonTokenType.EndObject)
            {
                throw new JsonException("$ref should be the only property");
            }

            return result;
        }

        public static bool TryReadStringObjectDictionary(this ref Utf8JsonReader reader, string propertyName, ref IReadOnlyDictionary<string, object?>? value)
        {
            if (reader.GetString() != propertyName)
            {
                return false;
            }

            if (reader.GetString() != propertyName)
            {
                return false;
            }

            reader.Read();
            reader.Read();

            var result = new Dictionary<string, object?>();
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                if (reader.TokenType != JsonTokenType.PropertyName)
                {
                    throw new JsonException();
                }

                string? argumentName = reader.GetString();
                if (argumentName is null)
                {
                    throw new JsonException();
                }

                // skip $id property since the decorator argument should not be referenced anyway
                if (argumentName == "$id")
                {
                    reader.SkipProperty();
                    continue;
                }

                using var document = JsonDocument.ParseValue(ref reader);
                var propertyValue = ConvertJsonElementToObject(document.RootElement);
                result[argumentName] = propertyValue;
                reader.Read();
            }
            value = result;
            return true;
        }

        public static object? ConvertJsonElementToObject(JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var result = new Dictionary<string, object?>();
                    foreach (JsonProperty property in element.EnumerateObject())
                    {
                        result.Add(property.Name, ConvertJsonElementToObject(property.Value));
                    }
                    return result;
                case JsonValueKind.Array:
                    return element.EnumerateArray().Select(s => ConvertJsonElementToObject(s)).ToArray();
                case JsonValueKind.String:
                    return element.GetString()!;
                case JsonValueKind.Number:
                    if (element.TryGetInt32(out int integer))
                    {
                        return integer;
                    }
                    else if (element.TryGetInt64(out long longNumber))
                    {
                        return longNumber;
                    }
                    else if (element.TryGetSingle(out float floatNumber))
                    {
                        return floatNumber;
                    }
                    else
                    {
                        return element.GetDouble();
                    }
                case JsonValueKind.True:
                case JsonValueKind.False:
                    return element.GetBoolean();
                default:
                    return null;
            }
        }
        public static void SkipProperty(this ref Utf8JsonReader reader)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            reader.Read();
            reader.SkipValue();
        }

        private static void SkipValue(this ref Utf8JsonReader reader)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.StartObject:
                    reader.Read();
                    while (reader.TokenType != JsonTokenType.EndObject)
                    {
                        reader.SkipProperty();
                    }
                    reader.Read();
                    break;
                case JsonTokenType.StartArray:
                    reader.Read();
                    while (reader.TokenType != JsonTokenType.EndArray)
                    {
                        reader.SkipValue();
                    }
                    reader.Read();
                    break;
                case JsonTokenType.String:
                case JsonTokenType.Number:
                case JsonTokenType.True:
                case JsonTokenType.False:
                case JsonTokenType.Null:
                    reader.Read();
                    break;
                case JsonTokenType.Comment:
                case JsonTokenType.None:
                case JsonTokenType.EndObject:
                case JsonTokenType.EndArray:
                case JsonTokenType.PropertyName:
                    throw new InvalidOperationException("Unexpected token type");
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }
    }
}
