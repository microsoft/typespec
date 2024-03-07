// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Serialization.Bicep;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Types;
using Azure.ResourceManager.Models;

namespace AutoRest.CSharp.Output.Builders
{
    internal class SerializationBuilder
    {
        public static SerializationFormat GetDefaultSerializationFormat(CSharpType type)
        {
            if (type.EqualsIgnoreNullable(typeof(byte[])))
            {
                return SerializationFormat.Bytes_Base64;
            }

            if (type.EqualsIgnoreNullable(typeof(DateTimeOffset)))
            {
                return SerializationFormat.DateTime_ISO8601;
            }

            if (type.EqualsIgnoreNullable(typeof(TimeSpan)))
            {
                return SerializationFormat.Duration_ISO8601;
            }

            return SerializationFormat.Default;
        }

        public static SerializationFormat GetSerializationFormat(InputType type) => type switch
        {
            InputLiteralType literalType => GetSerializationFormat(literalType.LiteralValueType),
            InputListType listType => GetSerializationFormat(listType.ElementType),
            InputDictionaryType dictionaryType => GetSerializationFormat(dictionaryType.ValueType),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputTypeKind.BytesBase64Url => SerializationFormat.Bytes_Base64Url,
                InputTypeKind.Bytes => SerializationFormat.Bytes_Base64,
                InputTypeKind.Date => SerializationFormat.Date_ISO8601,
                InputTypeKind.DateTime => SerializationFormat.DateTime_ISO8601,
                InputTypeKind.DateTimeISO8601 => SerializationFormat.DateTime_ISO8601,
                InputTypeKind.DateTimeRFC1123 => SerializationFormat.DateTime_RFC1123,
                InputTypeKind.DateTimeRFC3339 => SerializationFormat.DateTime_RFC3339,
                InputTypeKind.DateTimeRFC7231 => SerializationFormat.DateTime_RFC7231,
                InputTypeKind.DateTimeUnix => SerializationFormat.DateTime_Unix,
                InputTypeKind.DurationISO8601 => SerializationFormat.Duration_ISO8601,
                InputTypeKind.DurationConstant => SerializationFormat.Duration_Constant,
                InputTypeKind.DurationSeconds => SerializationFormat.Duration_Seconds,
                InputTypeKind.DurationSecondsFloat => SerializationFormat.Duration_Seconds_Float,
                InputTypeKind.Time => SerializationFormat.Time_ISO8601,
                _ => SerializationFormat.Default
            },
            _ => SerializationFormat.Default
        };

        internal static SerializationFormat GetSerializationFormat(InputType inputType, CSharpType valueType)
        {
            var serializationFormat = GetSerializationFormat(inputType);
            return serializationFormat != SerializationFormat.Default ? serializationFormat : GetDefaultSerializationFormat(valueType);
        }

        public static ObjectSerialization Build(BodyMediaType bodyMediaType, InputType inputType, CSharpType type, SerializationFormat? serializationFormat) => bodyMediaType switch
        {
            BodyMediaType.Xml => BuildXmlElementSerialization(inputType, type, null, true),
            BodyMediaType.Json => BuildJsonSerialization(inputType, type, false, serializationFormat ?? GetSerializationFormat(inputType, type)),
            _ => throw new NotImplementedException(bodyMediaType.ToString())
        };

        private static XmlElementSerialization BuildXmlElementSerialization(InputType inputType, CSharpType type, string? name, bool isRoot)
        {
            return inputType switch
            {
                InputListType listType => new XmlArraySerialization(TypeFactory.GetImplementationType(type), BuildXmlElementSerialization(listType.ElementType, TypeFactory.GetElementType(type), null, false), name ?? inputType.Name, isRoot),
                InputDictionaryType dictionaryType => new XmlDictionarySerialization(TypeFactory.GetImplementationType(type), BuildXmlElementSerialization(dictionaryType.ValueType, TypeFactory.GetElementType(type), null, false), name ?? inputType.Name),
                CodeModelType cmt => BuildXmlElementSerialization(cmt.Schema, type, name, isRoot),
                _ => new XmlElementValueSerialization(name ?? inputType.Name, new XmlValueSerialization(type, GetSerializationFormat(inputType)))
            };
        }

        public ObjectSerialization Build(KnownMediaType? mediaType, Schema schema, CSharpType type) => mediaType switch
        {
            KnownMediaType.Json => BuildSerialization(schema, type, false),
            KnownMediaType.Xml => BuildXmlElementSerialization(schema, type, schema.XmlName ?? schema.Name, true),
            _ => throw new NotImplementedException(mediaType.ToString())
        };


        private static XmlElementSerialization BuildXmlElementSerialization(Schema schema, CSharpType type, string? name, bool isRoot)
        {
            string xmlName =
                schema.XmlName ??
                name ??
                schema.Name;

            switch (schema)
            {
                case ConstantSchema constantSchema:
                    return BuildXmlElementSerialization(constantSchema.ValueType, type, name, false);
                case ArraySchema arraySchema:
                    var wrapped = isRoot || arraySchema.Serialization?.Xml?.Wrapped == true;

                    return new XmlArraySerialization(
                        TypeFactory.GetImplementationType(type),
                        BuildXmlElementSerialization(arraySchema.ElementType, TypeFactory.GetElementType(type), null, false),
                        xmlName,
                        wrapped);

                case DictionarySchema dictionarySchema:
                    return new XmlDictionarySerialization(
                        TypeFactory.GetImplementationType(type),
                        BuildXmlElementSerialization(dictionarySchema.ElementType, TypeFactory.GetElementType(type), null, false),
                        xmlName);
                default:
                    return new XmlElementValueSerialization(xmlName, BuildXmlValueSerialization(schema, type));
            }
        }

        private static XmlValueSerialization BuildXmlValueSerialization(Schema schema, CSharpType type)
        {
            return new XmlValueSerialization(type, BuilderHelpers.GetSerializationFormat(schema));
        }

        private static bool IsManagedServiceIdentityV3(Schema schema, CSharpType type)
        {
            // If the type is the common type ManagedServiceIdentity and the schema contains a type property with sealed enum or extensible enum schema which has a choice of v3 "SystemAssigned,UserAssigned" value,
            // then this is a v3 version of ManagedServiceIdentity.
            if (!type.IsFrameworkType && type.Implementation is SystemObjectType systemObjectType
                && systemObjectType.SystemType == typeof(ManagedServiceIdentity)
                && schema is ObjectSchema objectSchema
                && (objectSchema.Properties.FirstOrDefault(p => p.SerializedName == "type")?.Schema is SealedChoiceSchema sealedChoiceSchema && sealedChoiceSchema.Choices.Any(c => c.Value == ManagedServiceIdentityTypeV3Converter.SystemAssignedUserAssignedV3Value)
                    || objectSchema.Properties.FirstOrDefault(p => p.SerializedName == "type")?.Schema is ChoiceSchema choiceSchema && choiceSchema.Choices.Any(c => c.Value == ManagedServiceIdentityTypeV3Converter.SystemAssignedUserAssignedV3Value)))
            {
                return true;
            }
            return false;
        }

        public static JsonSerialization BuildJsonSerialization(InputType inputType, CSharpType valueType, bool isCollectionElement, SerializationFormat serializationFormat)
        {
            if (valueType.IsFrameworkType && valueType.FrameworkType == typeof(JsonElement))
            {
                return new JsonValueSerialization(valueType, serializationFormat, valueType.IsNullable || isCollectionElement);
            }

            return inputType switch
            {
                CodeModelType codeModelType => BuildSerialization(codeModelType.Schema, valueType, isCollectionElement),
                InputListType listType => new JsonArraySerialization(TypeFactory.GetImplementationType(valueType), BuildJsonSerialization(listType.ElementType, TypeFactory.GetElementType(valueType), true, serializationFormat), valueType.IsNullable || (isCollectionElement && !valueType.IsValueType)),
                InputDictionaryType dictionaryType => new JsonDictionarySerialization(TypeFactory.GetImplementationType(valueType), BuildJsonSerialization(dictionaryType.ValueType, TypeFactory.GetElementType(valueType), true, serializationFormat), valueType.IsNullable || (isCollectionElement && !valueType.IsValueType)),
                _ => new JsonValueSerialization(valueType, serializationFormat, valueType.IsNullable || (isCollectionElement && !valueType.IsValueType)) // nullable CSharp type like int?, Etag?, and reference type in collection
            };
        }

        public static JsonSerialization BuildSerialization(Schema schema, CSharpType type, bool isCollectionElement)
        {
            if (type.IsFrameworkType && type.FrameworkType == typeof(JsonElement))
            {
                return new JsonValueSerialization(type, BuilderHelpers.GetSerializationFormat(schema), type.IsNullable);
            }

            switch (schema)
            {
                case ConstantSchema constantSchema:
                    return BuildSerialization(constantSchema.ValueType, type, isCollectionElement);
                case ArraySchema arraySchema:
                    return new JsonArraySerialization(
                        TypeFactory.GetImplementationType(type),
                        BuildSerialization(arraySchema.ElementType, TypeFactory.GetElementType(type), true),
                        type.IsNullable);
                case DictionarySchema dictionarySchema:
                    return new JsonDictionarySerialization(
                        TypeFactory.GetImplementationType(type),
                        BuildSerialization(dictionarySchema.ElementType, TypeFactory.GetElementType(type), true),
                        type.IsNullable);
                default:
                    JsonSerializationOptions options = IsManagedServiceIdentityV3(schema, type) ? JsonSerializationOptions.UseManagedServiceIdentityV3 : JsonSerializationOptions.None;
                    return new JsonValueSerialization(type, BuilderHelpers.GetSerializationFormat(schema), type.IsNullable || (isCollectionElement && !type.IsValueType), options);
            }
        }

        public XmlObjectSerialization BuildXmlObjectSerialization(ObjectSchema objectSchema, SerializableObjectType objectType)
        {
            List<XmlObjectElementSerialization> elements = new List<XmlObjectElementSerialization>();
            List<XmlObjectAttributeSerialization> attributes = new List<XmlObjectAttributeSerialization>();
            List<XmlObjectArraySerialization> embeddedArrays = new List<XmlObjectArraySerialization>();
            XmlObjectContentSerialization? contentSerialization = null;

            foreach (var objectTypeLevel in objectType.EnumerateHierarchy())
            {
                foreach (ObjectTypeProperty objectProperty in objectTypeLevel.Properties)
                {
                    var property = objectProperty.SchemaProperty;
                    if (property == null)
                    {
                        continue;
                    }

                    var name = property.SerializedName;
                    var isAttribute = property.Schema.Serialization?.Xml?.Attribute == true;
                    var isContent = property.Schema.Serialization?.Xml?.Text == true;

                    if (isContent)
                    {
                        contentSerialization = new XmlObjectContentSerialization(
                            objectProperty,
                            BuildXmlValueSerialization(property.Schema, objectProperty.Declaration.Type));
                    }
                    else if (isAttribute)
                    {
                        attributes.Add(
                            new XmlObjectAttributeSerialization(
                                name,
                                objectProperty,
                                BuildXmlValueSerialization(property.Schema, objectProperty.Declaration.Type)
                            )
                        );
                    }
                    else
                    {
                        XmlElementSerialization valueSerialization = BuildXmlElementSerialization(property.Schema, objectProperty.Declaration.Type, name, false);

                        if (valueSerialization is XmlArraySerialization arraySerialization)
                        {
                            embeddedArrays.Add(new XmlObjectArraySerialization(objectProperty, arraySerialization));
                        }
                        else
                        {
                            elements.Add(
                                new XmlObjectElementSerialization(
                                    objectProperty,
                                    valueSerialization
                                )
                            );
                        }
                    }
                }
            }

            return new XmlObjectSerialization(
                objectSchema.Serialization?.Xml?.Name ?? objectSchema.Language.Default.Name,
                objectType, elements.ToArray(), attributes.ToArray(), embeddedArrays.ToArray(),
                contentSerialization
                );
        }

        public BicepObjectSerialization? BuildBicepObjectSerialization(SerializableObjectType objectType, JsonObjectSerialization jsonObjectSerialization)
            => new BicepObjectSerialization(objectType, jsonObjectSerialization);

        private IEnumerable<JsonPropertySerialization> GetPropertySerializationsFromBag(SerializationPropertyBag propertyBag, SchemaObjectType objectType)
        {
            foreach (var (property, serializationMapping) in propertyBag.Properties)
            {
                var schemaProperty = property.SchemaProperty!; // we ensured this is never null when constructing the list
                var parameter = objectType.SerializationConstructor.FindParameterByInitializedProperty(property);
                if (parameter is null)
                {
                    throw new InvalidOperationException($"Serialization constructor of the type {objectType.Declaration.Name} has no parameter for {schemaProperty.SerializedName} input property");
                }

                var serializedName = serializationMapping?.SerializationPath?[^1] ?? schemaProperty.SerializedName;
                var isRequired = schemaProperty.IsRequired;
                var shouldExcludeInWireSerialization = schemaProperty.IsReadOnly;
                var serialization = BuildSerialization(schemaProperty.Schema, property.Declaration.Type, false);

                var memberValueExpression = new TypedMemberExpression(null, property.Declaration.Name, property.Declaration.Type);
                TypedMemberExpression? enumerableExpression = null;
                if (property.SchemaProperty is not null && property.SchemaProperty.Extensions is not null && property.SchemaProperty.Extensions.IsEmbeddingsVector)
                {
                    enumerableExpression = property.Declaration.Type.IsNullable
                        ? new TypedMemberExpression(null, $"{property.Declaration.Name}.{nameof(Nullable<ReadOnlyMemory<object>>.Value)}.{nameof(ReadOnlyMemory<object>.Span)}", typeof(ReadOnlySpan<>).MakeGenericType(property.Declaration.Type.Arguments[0].FrameworkType))
                        : new TypedMemberExpression(null, $"{property.Declaration.Name}.{nameof(ReadOnlyMemory<object>.Span)}", typeof(ReadOnlySpan<>).MakeGenericType(property.Declaration.Type.Arguments[0].FrameworkType));
                }
                yield return new JsonPropertySerialization(
                    parameter.Name,
                    memberValueExpression,
                    serializedName,
                    property.ValueType,
                    serialization,
                    isRequired,
                    shouldExcludeInWireSerialization,
                    serializationHooks: new CustomSerializationHooks(
                        serializationMapping?.JsonSerializationValueHook,
                        serializationMapping?.JsonDeserializationValueHook,
                        serializationMapping?.BicepSerializationValueHook),
                    enumerableExpression: enumerableExpression);
            }

            foreach ((string name, SerializationPropertyBag innerBag) in propertyBag.Bag)
            {
                JsonPropertySerialization[] serializationProperties = GetPropertySerializationsFromBag(innerBag, objectType).ToArray();
                yield return new JsonPropertySerialization(name, serializationProperties);
            }
        }

        public JsonObjectSerialization BuildJsonObjectSerialization(ObjectSchema objectSchema, SchemaObjectType objectType)
        {
            var propertyBag = new SerializationPropertyBag();
            foreach (var objectTypeLevel in objectType.EnumerateHierarchy())
            {
                foreach (var objectTypeProperty in objectTypeLevel.Properties)
                {
                    if (objectTypeProperty.SchemaProperty != null)
                    {
                        propertyBag.Properties.Add(objectTypeProperty, objectType.GetForMemberSerialization(objectTypeProperty.Declaration.Name));
                    }
                }
            }

            PopulatePropertyBag(propertyBag, 0);
            var properties = GetPropertySerializationsFromBag(propertyBag, objectType).ToArray();
            var additionalProperties = CreateAdditionalProperties(objectSchema, objectType);
            return new JsonObjectSerialization(objectType, objectType.SerializationConstructor.Signature.Parameters, properties, additionalProperties, objectType.Discriminator, objectType.IncludeConverter);
        }

        private class SerializationPropertyBag
        {
            public Dictionary<string, SerializationPropertyBag> Bag { get; } = new();
            public Dictionary<ObjectTypeProperty, SourcePropertySerializationMapping?> Properties { get; } = new();
        }

        private static void PopulatePropertyBag(SerializationPropertyBag propertyBag, int depthIndex)
        {
            foreach (var (property, serializationMapping) in propertyBag.Properties.ToArray())
            {
                var schemaProperty = property.SchemaProperty!; // we ensure this is not null when we build the array
                ICollection<string> flattenedNames = serializationMapping?.SerializationPath as ICollection<string> ?? schemaProperty.FlattenedNames;
                if (depthIndex >= (flattenedNames?.Count ?? 0) - 1)
                {
                    continue;
                }

                string name = flattenedNames!.ElementAt(depthIndex);
                if (!propertyBag.Bag.TryGetValue(name, out SerializationPropertyBag? namedBag))
                {
                    namedBag = new SerializationPropertyBag();
                    propertyBag.Bag.Add(name, namedBag);
                }

                namedBag.Properties.Add(property, serializationMapping);
                propertyBag.Properties.Remove(property);
            }

            foreach (SerializationPropertyBag innerBag in propertyBag.Bag.Values)
            {
                PopulatePropertyBag(innerBag, depthIndex + 1);
            }
        }

        private JsonAdditionalPropertiesSerialization? CreateAdditionalProperties(ObjectSchema objectSchema, ObjectType objectType)
        {
            var inheritedDictionarySchema = objectSchema.Parents!.All.OfType<DictionarySchema>().FirstOrDefault();
            bool shouldExcludeInWireSerialization = false;
            ObjectTypeProperty? additionalPropertiesProperty = null;
            foreach (var obj in objectType.EnumerateHierarchy())
            {
                additionalPropertiesProperty = obj.AdditionalPropertiesProperty ?? (obj as SerializableObjectType)?.RawDataField;
                if (additionalPropertiesProperty != null)
                {
                    // if this is a real "AdditionalProperties", we should NOT exclude it in wire
                    shouldExcludeInWireSerialization = additionalPropertiesProperty != obj.AdditionalPropertiesProperty;
                    break;
                }
            }

            if (additionalPropertiesProperty == null)
            {
                return null;
            }

            var dictionaryValueType = additionalPropertiesProperty.Declaration.Type.Arguments[1];
            Debug.Assert(!dictionaryValueType.IsNullable, $"{typeof(JsonCodeWriterExtensions)} implicitly relies on {additionalPropertiesProperty.Declaration.Name} dictionary value being non-nullable");
            JsonSerialization valueSerialization;
            if (inheritedDictionarySchema is not null)
            {
                valueSerialization = BuildSerialization(inheritedDictionarySchema.ElementType, dictionaryValueType, false);
            }
            else
            {
                valueSerialization = new JsonValueSerialization(dictionaryValueType, SerializationFormat.Default, true);
            }

            return new JsonAdditionalPropertiesSerialization(
                    additionalPropertiesProperty,
                    valueSerialization,
                    new CSharpType(typeof(Dictionary<,>), additionalPropertiesProperty.Declaration.Type.Arguments),
                    shouldExcludeInWireSerialization);
        }
    }
}
