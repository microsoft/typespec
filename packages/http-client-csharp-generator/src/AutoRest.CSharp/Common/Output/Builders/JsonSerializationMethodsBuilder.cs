// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Serialization.Bicep;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using Azure.ResourceManager.Resources.Models;
using Microsoft.CodeAnalysis;
using static AutoRest.CSharp.Common.Output.Models.Snippets;
using MemberExpression = AutoRest.CSharp.Common.Output.Expressions.ValueExpressions.MemberExpression;
using SerializationFormat = AutoRest.CSharp.Output.Models.Serialization.SerializationFormat;
using SwitchCase = AutoRest.CSharp.Common.Output.Expressions.Statements.SwitchCase;

namespace AutoRest.CSharp.Common.Output.Builders
{
    internal static class JsonSerializationMethodsBuilder
    {
        public static IEnumerable<Method> BuildJsonSerializationMethods(JsonObjectSerialization json)
        {
            var jsonModelInterface = json.IJsonModelInterface;
            var typeOfT = jsonModelInterface.Arguments[0];

            var model = typeOfT.Implementation as SerializableObjectType;
            Debug.Assert(model is not null);

            var useModelReaderWriter = Configuration.UseModelReaderWriter;

            // void IUtf8JsonSerializable.Write(Utf8JsonWriter writer)
            var writer = new Utf8JsonWriterExpression(KnownParameters.Serializations.Utf8JsonWriter);
            if (useModelReaderWriter)
            {
                yield return new
                (
                    new MethodSignature(Configuration.ApiTypes.IUtf8JsonSerializableWriteName, null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.Utf8JsonWriter }, ExplicitInterface: Configuration.ApiTypes.IUtf8JsonSerializableType),
                    This.CastTo(jsonModelInterface).Invoke(nameof(IJsonModel<object>.Write), writer, ModelReaderWriterOptionsExpression.Wire)
                );
            }
            else
            {
                yield return new
                (
                    new MethodSignature(Configuration.ApiTypes.IUtf8JsonSerializableWriteName, null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.Utf8JsonWriter }, ExplicitInterface: Configuration.ApiTypes.IUtf8JsonSerializableType),
                    WriteObject(json, writer, null)
                );
            }

            if (useModelReaderWriter)
            {
                // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
                var options = new ModelReaderWriterOptionsExpression(KnownParameters.Serializations.Options);
                yield return new
                (
                    new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.Utf8JsonWriter, KnownParameters.Serializations.Options }, ExplicitInterface: jsonModelInterface),
                    WriteObject(json, writer, options)
                );

                // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
                var reader = (ValueExpression)KnownParameters.Serializations.Utf8JsonReader;
                yield return new
                (
                    new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { KnownParameters.Serializations.Utf8JsonReader, KnownParameters.Serializations.Options }, ExplicitInterface: jsonModelInterface),
                    new MethodBodyStatement[]
                    {
                    Serializations.ValidateJsonFormat(options, json.IPersistableModelTInterface),
                    // using var document = JsonDocument.ParseValue(ref reader);
                    UsingDeclare("document", JsonDocumentExpression.ParseValue(reader), out var docVariable),
                    // return DeserializeXXX(doc.RootElement, options);
                    Return(SerializableObjectTypeExpression.Deserialize(model, docVariable.RootElement, options))
                    }
                );

                // if the model is a struct, it needs to implement IJsonModel<object> as well which leads to another 2 methods
                if (json.IJsonModelObjectInterface is { } jsonModelObjectInterface)
                {
                    // void IJsonModel<object>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
                    yield return new
                    (
                        new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.Utf8JsonWriter, KnownParameters.Serializations.Options }, ExplicitInterface: jsonModelObjectInterface),
                        This.CastTo(jsonModelInterface).Invoke(nameof(IJsonModel<object>.Write), writer, options)
                    );

                    // object IJsonModel<object>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
                    yield return new
                    (
                        new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeof(object), null, new[] { KnownParameters.Serializations.Utf8JsonReader, KnownParameters.Serializations.Options }, ExplicitInterface: jsonModelObjectInterface),
                        This.CastTo(jsonModelInterface).Invoke(nameof(IJsonModel<object>.Create), reader, options)
                    );
                }
            }
        }

        public static IEnumerable<Method> BuildIModelMethods(JsonObjectSerialization? json, XmlObjectSerialization? xml, BicepObjectSerialization? bicep)
        {
            // we do not need this if model reader writer feature is not enabled
            if (!Configuration.UseModelReaderWriter)
                yield break;

            var iModelTInterface = json?.IPersistableModelTInterface ?? xml?.IPersistableModelTInterface;
            var iModelObjectInterface = json?.IPersistableModelObjectInterface ?? xml?.IPersistableModelObjectInterface;
            // if we have json serialization, we must have this interface.
            // if we have xml serialization, we must have this interface.
            // therefore this type should never be null - because we cannot get here when json and xml both are null
            Debug.Assert(iModelTInterface != null, "iModelTInterface should not be null");

            var typeOfT = iModelTInterface.Arguments[0];
            var model = typeOfT.Implementation as SerializableObjectType;
            Debug.Assert(model is not null);

            var options = new ModelReaderWriterOptionsExpression(KnownParameters.Serializations.Options);
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
            yield return new
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, typeof(BinaryData), null, new[] { KnownParameters.Serializations.Options }, ExplicitInterface: iModelTInterface),
                BuildModelWriteMethodBody(json, xml, bicep, options, iModelTInterface).ToArray()
            );

            // T IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var data = new BinaryDataExpression(KnownParameters.Serializations.Data);
            yield return new
            (
                new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { KnownParameters.Serializations.Data, KnownParameters.Serializations.Options }, ExplicitInterface: iModelTInterface),
                BuildModelCreateMethodBody(model, json != null, xml != null, bicep != null, data, options, iModelTInterface).ToArray()
            );

            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            yield return new
            (
                new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { KnownParameters.Serializations.Options }, ExplicitInterface: iModelTInterface),
                xml != null ? Serializations.XmlFormat : Serializations.JsonFormat
            );

            // if the model is a struct, it needs to implement IPersistableModel<object> as well which leads to another 2 methods
            if (iModelObjectInterface is not null)
            {
                // BinaryData IPersistableModel<object>.Write(ModelReaderWriterOptions options)
                yield return new
                (
                    new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, typeof(BinaryData), null, new[] { KnownParameters.Serializations.Options }, ExplicitInterface: iModelObjectInterface),
                    // => (IPersistableModel<T>this).Write(options);
                    This.CastTo(iModelTInterface).Invoke(nameof(IPersistableModel<object>.Write), options)
                );

                // object IPersistableModel<object>.Create(BinaryData data, ModelReaderWriterOptions options)
                yield return new
                (
                    new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeof(object), null, new[] { KnownParameters.Serializations.Data, KnownParameters.Serializations.Options }, ExplicitInterface: iModelObjectInterface),
                    // => (IPersistableModel<T>this).Read(options);
                    This.CastTo(iModelTInterface).Invoke(nameof(IPersistableModel<object>.Create), data, options)
                );

                // ModelReaderWriterFormat IPersistableModel<object>.GetFormatFromOptions(ModelReaderWriterOptions options)
                yield return new
                (
                    new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { KnownParameters.Serializations.Options }, ExplicitInterface: iModelObjectInterface),
                    // => (IPersistableModel<T>this).GetFormatFromOptions(options);
                    This.CastTo(iModelTInterface).Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), options)
                );
            }

            // TODO should this be moved into SerializationBuilder or a more generic MethodBuilder now that it supports xml (and bicep)
            static IEnumerable<MethodBodyStatement> BuildModelWriteMethodBody(JsonObjectSerialization? json,
                XmlObjectSerialization? xml, BicepObjectSerialization? bicep,
                ModelReaderWriterOptionsExpression options, CSharpType iModelTInterface)
            {
                // var format = options.Format == "W" ? GetFormatFromOptions(options) : options.Format;
                yield return Serializations.GetConcreteFormat(options, iModelTInterface, out var format);

                yield return EmptyLine;

                var switchStatement = new SwitchStatement(format);

                if (json != null)
                {
                    var jsonCase = new SwitchCase(Serializations.JsonFormat,
                        Return(new InvokeStaticMethodExpression(typeof(ModelReaderWriter),
                            nameof(ModelReaderWriter.Write), new[] { This, options }))
                    );
                    switchStatement.Add(jsonCase);
                }

                if (bicep != null)
                {
                    var bicepCase = new SwitchCase(
                        Serializations.BicepFormat,
                        Return(
                            new InvokeInstanceMethodExpression(
                                null,
                                new MethodSignature(
                                    $"SerializeBicep",
                                    null,
                                    null,
                                    MethodSignatureModifiers.Private,
                                    typeof(BinaryData),
                                    null,
                                    new[]
                                    {
                                        KnownParameters.Serializations.Options
                                    }),
                                new ValueExpression[]
                                {
                                    options
                                })));
                    switchStatement.Add(bicepCase);
                }

                if (xml != null)
                {
                    /*  using MemoryStream stream = new MemoryStream();
                        using XmlWriter writer = XmlWriter.Create(stream);
                        ((IXmlSerializable)this).Write(writer, null);
                        writer.Flush();
                        // in the implementation of MemoryStream, `stream.Position` could never exceed `int.MaxValue`, therefore this if is redundant, we just need to keep the else branch
                        //if (stream.Position > int.MaxValue)
                        //{
                        //    return BinaryData.FromStream(stream);
                        //}
                        //else
                        //{
                            return new BinaryData(stream.GetBuffer().AsMemory(0, (int)stream.Position));
                        //}
                    */
                    var xmlCase = new SwitchCase(Serializations.XmlFormat,
                        new MethodBodyStatement[]
                        {
                            UsingDeclare("stream", typeof(MemoryStream), New.Instance(typeof(MemoryStream)), out var stream),
                            UsingDeclare("writer", typeof(XmlWriter), new InvokeStaticMethodExpression(typeof(XmlWriter), nameof(XmlWriter.Create), new[] { stream }), out var xmlWriter),
                            new InvokeInstanceMethodStatement(null, xml.WriteXmlMethodName, new[] { xmlWriter, Null, options }, false),
                            xmlWriter.Invoke(nameof(XmlWriter.Flush)).ToStatement(),
                            // return new BinaryData(stream.GetBuffer().AsMemory(0, (int)stream.Position));
                            Return(New.Instance(typeof(BinaryData),
                                InvokeStaticMethodExpression.Extension(
                                    typeof(MemoryExtensions),
                                    nameof(MemoryExtensions.AsMemory),
                                    stream.Invoke(nameof(MemoryStream.GetBuffer)),
                                    new[] { Int(0), stream.Property(nameof(Stream.Position)).CastTo(typeof(int)) }
                                    )))
                        }, addScope: true); // using statement must have a scope, if we do not have the addScope parameter here, the generated code will not compile
                    switchStatement.Add(xmlCase);
                }

                // default case
                /*
                 * throw new FormatException($"The model {nameof(T)} does not support '{options.Format}' format.");
                 */
                var typeOfT = iModelTInterface.Arguments[0];
                var defaultCase = SwitchCase.Default(
                    Serializations.ThrowValidationFailException(options.Format, typeOfT)
                );
                switchStatement.Add(defaultCase);

                yield return switchStatement;
            }

            static IEnumerable<MethodBodyStatement> BuildModelCreateMethodBody(SerializableObjectType model, bool hasJson, bool hasXml, bool hasBicep, BinaryDataExpression data, ModelReaderWriterOptionsExpression options, CSharpType iModelTInterface)
            {
                // var format = options.Format == "W" ? GetFormatFromOptions(options) : options.Format;
                yield return Serializations.GetConcreteFormat(options, iModelTInterface, out var format);

                yield return EmptyLine;

                var switchStatement = new SwitchStatement(format);

                if (hasJson)
                {
                    /* using var document = JsonDocument.ParseValue(ref reader);
                     * return DeserializeXXX(doc.RootElement, options);
                     */
                    var jsonCase = new SwitchCase(Serializations.JsonFormat,
                        new MethodBodyStatement[]
                        {
                            UsingDeclare("document", JsonDocumentExpression.Parse(data), out var docVariable),
                            Return(SerializableObjectTypeExpression.Deserialize(model, docVariable.RootElement, options))
                        }, addScope: true); // using statement must have a scope, if we do not have the addScope parameter here, the generated code will not compile
                    switchStatement.Add(jsonCase);
                }

                if (hasXml)
                {
                    // return DeserializeXmlCollection(XElement.Load(data.ToStream()), options);
                    var xmlCase = new SwitchCase(Serializations.XmlFormat,
                        Return(SerializableObjectTypeExpression.Deserialize(model, XElementExpression.Load(data.ToStream()), options)));
                    switchStatement.Add(xmlCase);
                }

                if (hasBicep)
                {
                    // throw new InvalidOperationException("Bicep deserialization is not supported for this type.");
                    var bicepCase = new SwitchCase(
                        Serializations.BicepFormat,
                        Throw(
                            New.Instance(typeof(InvalidOperationException),
                            Literal("Bicep deserialization is not supported for this type."))));
                    switchStatement.Add(bicepCase);
                }

                // default case
                /*
                 * throw new InvalidOperationException($"The model {nameof(T)} does not support '{options.Format}' format.");
                 */
                var typeOfT = iModelTInterface.Arguments[0];
                var defaultCase = SwitchCase.Default(
                    Serializations.ThrowValidationFailException(options.Format, typeOfT)
                );
                switchStatement.Add(defaultCase);

                yield return switchStatement;
            }
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static MethodBodyStatement[] WriteObject(JsonObjectSerialization serialization, Utf8JsonWriterExpression utf8JsonWriter, ModelReaderWriterOptionsExpression? options)
            => new[]
            {
                Serializations.ValidateJsonFormat(options, serialization.IPersistableModelTInterface),
                utf8JsonWriter.WriteStartObject(),
                WriteProperties(utf8JsonWriter, serialization.Properties, options).ToArray(),
                SerializeAdditionalProperties(utf8JsonWriter, options, serialization.AdditionalProperties),
                utf8JsonWriter.WriteEndObject()
            };

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> WriteProperties(Utf8JsonWriterExpression utf8JsonWriter, IEnumerable<JsonPropertySerialization> properties, ModelReaderWriterOptionsExpression? options)
        {
            foreach (JsonPropertySerialization property in properties)
            {
                if (property.ValueSerialization == null)
                {
                    // Flattened property
                    yield return Serializations.WrapInCheckNotWire(
                        property,
                        options?.Format,
                        new[]
                        {
                            utf8JsonWriter.WritePropertyName(property.SerializedName),
                            utf8JsonWriter.WriteStartObject(),
                            WriteProperties(utf8JsonWriter, property.PropertySerializations!, options).ToArray(),
                            utf8JsonWriter.WriteEndObject(),
                        });
                }
                else if (property.SerializedType is { IsNullable: true })
                {
                    var checkPropertyIsInitialized = TypeFactory.IsCollectionType(property.SerializedType) && !TypeFactory.IsReadOnlyMemory(property.SerializedType) && property.IsRequired
                        ? And(NotEqual(property.Value, Null), InvokeOptional.IsCollectionDefined(property.Value))
                        : NotEqual(property.Value, Null);

                    yield return Serializations.WrapInCheckNotWire(
                        property,
                        options?.Format,
                        InvokeOptional.WrapInIsDefined(
                            property,
                            new IfElseStatement(checkPropertyIsInitialized,
                                WritePropertySerialization(utf8JsonWriter, property),
                                utf8JsonWriter.WriteNull(property.SerializedName)
                            ))
                    );
                }
                else
                {
                    yield return Serializations.WrapInCheckNotWire(
                        property,
                        options?.Format,
                        InvokeOptional.WrapInIsDefined(property, WritePropertySerialization(utf8JsonWriter, property)));
                }
            }
        }

        private static MethodBodyStatement WritePropertySerialization(Utf8JsonWriterExpression utf8JsonWriter, JsonPropertySerialization serialization)
        {
            return new[]
            {
                utf8JsonWriter.WritePropertyName(serialization.SerializedName),
                serialization.CustomSerializationMethodName is {} serializationMethodName
                    ? InvokeCustomSerializationMethod(serializationMethodName, utf8JsonWriter)
                    : SerializeExpression(utf8JsonWriter, serialization.ValueSerialization, serialization.EnumerableValue ?? serialization.Value)
            };
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static MethodBodyStatement SerializeAdditionalProperties(Utf8JsonWriterExpression utf8JsonWriter, ModelReaderWriterOptionsExpression? options, JsonAdditionalPropertiesSerialization? additionalProperties)
        {
            if (additionalProperties is null)
            {
                return EmptyStatement;
            }

            var additionalPropertiesExpression = new DictionaryExpression(additionalProperties.Type.Arguments[0], additionalProperties.Type.Arguments[1], additionalProperties.Value);
            MethodBodyStatement statement = new ForeachStatement("item", additionalPropertiesExpression, out KeyValuePairExpression item)
            {
                utf8JsonWriter.WritePropertyName(item.Key),
                SerializeExpression(utf8JsonWriter, additionalProperties.ValueSerialization, item.Value)
            };

            // if it should be excluded in wire serialization, it is a raw data field and we need to check if it is null
            // otherwise it is the public AdditionalProperties property, we always instantiate it therefore we do not need to check null.
            statement = additionalProperties.ShouldExcludeInWireSerialization ?
                new IfStatement(NotEqual(additionalPropertiesExpression, Null))
                {
                    statement
                } : statement;

            return Serializations.WrapInCheckNotWire(
                additionalProperties,
                options?.Format,
                statement);
        }

        public static MethodBodyStatement SerializeExpression(Utf8JsonWriterExpression utf8JsonWriter, JsonSerialization? serialization, ValueExpression expression)
            => serialization switch
            {
                JsonArraySerialization array => SerializeArray(utf8JsonWriter, array, new EnumerableExpression(TypeFactory.GetElementType(array.Type), expression)),
                JsonDictionarySerialization dictionary => SerializeDictionary(utf8JsonWriter, dictionary, new DictionaryExpression(dictionary.Type.Arguments[0], dictionary.Type.Arguments[1], expression)),
                JsonValueSerialization value => SerializeValue(utf8JsonWriter, value, expression),
                _ => throw new NotSupportedException()
            };

        private static MethodBodyStatement SerializeArray(Utf8JsonWriterExpression utf8JsonWriter, JsonArraySerialization arraySerialization, EnumerableExpression array)
        {
            return new[]
            {
                utf8JsonWriter.WriteStartArray(),
                new ForeachStatement("item", array, out var item)
                {
                    CheckCollectionItemForNull(utf8JsonWriter, arraySerialization.ValueSerialization, item),
                    SerializeExpression(utf8JsonWriter, arraySerialization.ValueSerialization, item)
                },
                utf8JsonWriter.WriteEndArray()
            };
        }

        private static MethodBodyStatement SerializeDictionary(Utf8JsonWriterExpression utf8JsonWriter, JsonDictionarySerialization dictionarySerialization, DictionaryExpression dictionary)
        {
            return new[]
            {
                utf8JsonWriter.WriteStartObject(),
                new ForeachStatement("item", dictionary, out KeyValuePairExpression keyValuePair)
                {
                    utf8JsonWriter.WritePropertyName(keyValuePair.Key),
                    CheckCollectionItemForNull(utf8JsonWriter, dictionarySerialization.ValueSerialization, keyValuePair.Value),
                    SerializeExpression(utf8JsonWriter, dictionarySerialization.ValueSerialization, keyValuePair.Value)
                },
                utf8JsonWriter.WriteEndObject()
            };
        }

        private static MethodBodyStatement SerializeValue(Utf8JsonWriterExpression utf8JsonWriter, JsonValueSerialization valueSerialization, ValueExpression value)
        {
            if (valueSerialization.Type.SerializeAs is not null)
            {
                return SerializeFrameworkTypeValue(utf8JsonWriter, valueSerialization, value, valueSerialization.Type.SerializeAs);
            }

            if (valueSerialization.Type.IsFrameworkType)
            {
                return SerializeFrameworkTypeValue(utf8JsonWriter, valueSerialization, value, valueSerialization.Type.FrameworkType);
            }

            switch (valueSerialization.Type.Implementation)
            {
                case SystemObjectType systemObjectType when IsCustomJsonConverterAdded(systemObjectType.SystemType):
                    if (valueSerialization.Options == JsonSerializationOptions.UseManagedServiceIdentityV3)
                    {
                        return new[]
                        {
                            Var("serializeOptions", New.JsonSerializerOptions(), out var serializeOptions),
                            InvokeJsonSerializerSerializeMethod(utf8JsonWriter, value, serializeOptions)
                        };
                    }

                    return InvokeJsonSerializerSerializeMethod(utf8JsonWriter, value);

                case ObjectType:
                    return utf8JsonWriter.WriteObjectValue(value);

                case EnumType { IsIntValueType: true, IsExtensible: false } enumType:
                    return utf8JsonWriter.WriteNumberValue(new CastExpression(value.NullableStructValue(valueSerialization.Type), enumType.ValueType));

                case EnumType { IsNumericValueType: true } enumType:
                    return utf8JsonWriter.WriteNumberValue(new EnumExpression(enumType, value.NullableStructValue(valueSerialization.Type)).ToSerial());

                case EnumType enumType:
                    return utf8JsonWriter.WriteStringValue(new EnumExpression(enumType, value.NullableStructValue(valueSerialization.Type)).ToSerial());

                default:
                    throw new NotSupportedException($"Cannot build serialization expression for type {valueSerialization.Type}, please add `CodeGenMemberSerializationHooks` to specify the serialization of this type with the customized property");
            }
        }

        private static MethodBodyStatement SerializeFrameworkTypeValue(Utf8JsonWriterExpression utf8JsonWriter, JsonValueSerialization valueSerialization, ValueExpression value, Type valueType)
        {
            if (valueType == typeof(JsonElement))
            {
                return new JsonElementExpression(value).WriteTo(utf8JsonWriter);
            }

            if (valueType == typeof(Nullable<>))
            {
                valueType = valueSerialization.Type.Arguments[0].FrameworkType;
            }

            value = value.NullableStructValue(valueSerialization.Type);

            if (valueType == typeof(decimal) ||
                valueType == typeof(double) ||
                valueType == typeof(float) ||
                valueType == typeof(long) ||
                valueType == typeof(int) ||
                valueType == typeof(short) ||
                valueType == typeof(sbyte) ||
                valueType == typeof(byte))
            {
                return utf8JsonWriter.WriteNumberValue(value);
            }

            if (valueType == typeof(object))
            {
                return utf8JsonWriter.WriteObjectValue(value);
            }

            // These are string-like types that could implicitly convert to string type
            if (valueType == typeof(string) || valueType == typeof(char) || valueType == typeof(Guid) || valueType == typeof(ResourceIdentifier) || valueType == typeof(ResourceType) || valueType == typeof(AzureLocation))
            {
                return utf8JsonWriter.WriteStringValue(value);
            }

            if (valueType == typeof(bool))
            {
                return utf8JsonWriter.WriteBooleanValue(value);
            }

            if (valueType == typeof(byte[]))
            {
                return utf8JsonWriter.WriteBase64StringValue(value, valueSerialization.Format.ToFormatSpecifier());
            }

            if (valueType == typeof(DateTimeOffset) || valueType == typeof(DateTime) || valueType == typeof(TimeSpan))
            {
                var format = valueSerialization.Format.ToFormatSpecifier();

                if (valueSerialization.Format is SerializationFormat.Duration_Seconds)
                {
                    return utf8JsonWriter.WriteNumberValue(InvokeConvert.ToInt32(new TimeSpanExpression(value).ToString(format)));
                }

                if (valueSerialization.Format is SerializationFormat.Duration_Seconds_Float)
                {
                    return utf8JsonWriter.WriteNumberValue(InvokeConvert.ToDouble(new TimeSpanExpression(value).ToString(format)));
                }

                if (valueSerialization.Format is SerializationFormat.DateTime_Unix)
                {
                    return utf8JsonWriter.WriteNumberValue(value, format);
                }
                return format is not null
                    ? utf8JsonWriter.WriteStringValue(value, format)
                    : utf8JsonWriter.WriteStringValue(value);
            }

            // These are string-like types that cannot implicitly convert to string type, therefore we need to call ToString on them
            if (valueType == typeof(ETag) || valueType == typeof(ContentType) || valueType == typeof(IPAddress) || valueType == typeof(RequestMethod) || valueType == typeof(ExtendedLocationType))
            {
                return utf8JsonWriter.WriteStringValue(value.InvokeToString());
            }

            if (valueType == typeof(Uri))
            {
                return utf8JsonWriter.WriteStringValue(new MemberExpression(value, nameof(Uri.AbsoluteUri)));
            }

            if (valueType == typeof(BinaryData))
            {
                var binaryDataValue = new BinaryDataExpression(value);
                if (valueSerialization.Format is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url)
                {
                    return utf8JsonWriter.WriteBase64StringValue(new BinaryDataExpression(value).ToArray(), valueSerialization.Format.ToFormatSpecifier());
                }

                return new IfElsePreprocessorDirective
                (
                    "NET6_0_OR_GREATER",
                    utf8JsonWriter.WriteRawValue(value),
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentExpression.Parse(binaryDataValue), out var jsonDocumentVar)
                    {
                        InvokeJsonSerializerSerializeMethod(utf8JsonWriter, new JsonDocumentExpression(jsonDocumentVar).RootElement)
                    }
                );
            }

            if (IsCustomJsonConverterAdded(valueType))
            {
                return InvokeJsonSerializerSerializeMethod(utf8JsonWriter, value);
            }

            throw new NotSupportedException($"Framework type {valueType} serialization not supported, please add `CodeGenMemberSerializationHooks` to specify the serialization of this type with the customized property");
        }

        private static MethodBodyStatement CheckCollectionItemForNull(Utf8JsonWriterExpression utf8JsonWriter, JsonSerialization valueSerialization, ValueExpression value)
            => CollectionItemRequiresNullCheckInSerialization(valueSerialization)
                ? new IfStatement(Equal(value, Null)) { utf8JsonWriter.WriteNullValue(), Continue }
                : EmptyStatement;

        public static Method? BuildDeserialize(TypeDeclarationOptions declaration, JsonObjectSerialization serialization, INamedTypeSymbol? existingType)
        {
            var methodName = $"Deserialize{declaration.Name}";
            var signature = Configuration.UseModelReaderWriter ?
                new MethodSignature(methodName, null, null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, serialization.Type, null, new[] { KnownParameters.Serializations.JsonElement, KnownParameters.Serializations.OptionalOptions }) :
                new MethodSignature(methodName, null, null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, serialization.Type, null, new[] { KnownParameters.Serializations.JsonElement });
            if (SourceInputHelper.TryGetExistingMethod(existingType, signature, out _))
            {
                return null;
            }

            return Configuration.UseModelReaderWriter ?
                new Method(signature, BuildDeserializeBody(serialization, new JsonElementExpression(KnownParameters.Serializations.JsonElement), new ModelReaderWriterOptionsExpression(KnownParameters.Serializations.OptionalOptions)).ToArray()) :
                new Method(signature, BuildDeserializeBody(serialization, new JsonElementExpression(KnownParameters.Serializations.JsonElement), null).ToArray());
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> BuildDeserializeBody(JsonObjectSerialization serialization, JsonElementExpression jsonElement, ModelReaderWriterOptionsExpression? options)
        {
            // fallback to Default options if it is null
            if (options != null)
            {
                yield return AssignIfNull(options, ModelReaderWriterOptionsExpression.Wire);

                yield return EmptyLine;
            }

            if (!serialization.Type.IsValueType) // only return null for reference type (e.g. no enum)
            {
                yield return new IfStatement(jsonElement.ValueKindEqualsNull())
                {
                    Return(Null)
                };
            }

            var discriminator = serialization.Discriminator;
            if (discriminator is not null && discriminator.HasDescendants)
            {
                yield return new IfStatement(jsonElement.TryGetProperty(discriminator.SerializedName, out var discriminatorElement))
                {
                    new SwitchStatement(discriminatorElement.GetString(), GetDiscriminatorCases(jsonElement, discriminator, options).ToArray())
                };
            }
            // we redirect the deserialization to the `DefaultObjectType` (the unknown version of the discriminated set) if possible.
            // We could only do this when there is a discriminator, and the discriminator does not have a value (having a value indicating it is the child instead of base), and there is an unknown default object type to fall back, and I am not that fallback type.
            if (discriminator is { Value: null, DefaultObjectType: { } defaultObjectType } && !serialization.Type.Equals(defaultObjectType.Type))
            {
                yield return Return(GetDeserializeImplementation(discriminator.DefaultObjectType.Type.Implementation, jsonElement, options, null));
            }
            else
            {
                yield return WriteObjectInitialization(serialization, jsonElement, options).ToArray();
            }
        }

        // TODO -- make the options parameter non-nullable again when we remove the `use-model-reader-writer` flag
        private static IEnumerable<SwitchCase> GetDiscriminatorCases(JsonElementExpression element, ObjectTypeDiscriminator discriminator, ModelReaderWriterOptionsExpression? options)
        {
            foreach (var implementation in discriminator.Implementations)
            {
                yield return new SwitchCase(Literal(implementation.Key), Return(GetDeserializeImplementation(implementation.Type.Implementation, element, options, null)), true);
            }
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> WriteObjectInitialization(JsonObjectSerialization serialization, JsonElementExpression element, ModelReaderWriterOptionsExpression? options)
        {
            // this is the first level of object hierarchy
            // collect all properties and initialize the dictionary
            var propertyVariables = new Dictionary<JsonPropertySerialization, VariableReference>();

            CollectPropertiesForDeserialization(propertyVariables, serialization.Properties);

            var additionalProperties = serialization.AdditionalProperties;
            if (additionalProperties != null)
            {
                propertyVariables.Add(additionalProperties, new VariableReference(additionalProperties.Value.Type, additionalProperties.SerializationConstructorParameterName));
            }

            bool isThisTheDefaultDerivedType = serialization.Type.Equals(serialization.Discriminator?.DefaultObjectType?.Type);

            foreach (var variable in propertyVariables)
            {
                if (serialization.Discriminator?.SerializedName == variable.Key.SerializedName &&
                    isThisTheDefaultDerivedType &&
                    serialization.Discriminator.Value is not null &&
                    (!serialization.Discriminator.Property.ValueType.IsEnum || serialization.Discriminator.Property.ValueType.Implementation is EnumType { IsExtensible: true }))
                {
                    var defaultValue = serialization.Discriminator.Value.Value.Value?.ToString();
                    yield return Declare(variable.Value, Literal(defaultValue));
                }
                else
                {
                    yield return Declare(variable.Value, Default);
                }
            }

            var shouldTreatEmptyStringAsNull = Configuration.ModelsToTreatEmptyStringAsNull.Contains(serialization.Type.Name);
            var objAdditionalProperties = serialization.AdditionalProperties;
            if (objAdditionalProperties != null)
            {
                var dictionary = new VariableReference(objAdditionalProperties.Type, "additionalPropertiesDictionary");
                yield return Declare(dictionary, New.Instance(objAdditionalProperties.Type));
                yield return new ForeachStatement("property", element.EnumerateObject(), out var property)
                {
                    DeserializeIntoObjectProperties(serialization.Properties, objAdditionalProperties, new JsonPropertyExpression(property), new DictionaryExpression(objAdditionalProperties.Type.Arguments[0], objAdditionalProperties.Type.Arguments[1], dictionary), options, propertyVariables, shouldTreatEmptyStringAsNull).ToArray()
                };
                yield return Assign(propertyVariables[objAdditionalProperties], dictionary);
            }
            else
            {
                yield return new ForeachStatement("property", element.EnumerateObject(), out var property)
                {
                    DeserializeIntoObjectProperties(serialization.Properties, new JsonPropertyExpression(property), propertyVariables, shouldTreatEmptyStringAsNull, options)
                };
            }

            var parameterValues = propertyVariables.ToDictionary(v => v.Key.SerializationConstructorParameterName, v => GetOptional(v.Key, v.Value));
            var parameters = serialization.ConstructorParameters
                .Select(p => parameterValues[p.Name])
                .ToArray();

            yield return Return(New.Instance(serialization.Type, parameters));
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> DeserializeIntoObjectProperties(IEnumerable<JsonPropertySerialization> propertySerializations, JsonAdditionalPropertiesSerialization additionalPropertiesSerialization, JsonPropertyExpression jsonProperty, DictionaryExpression dictionary, ModelReaderWriterOptionsExpression? options, IReadOnlyDictionary<JsonPropertySerialization, VariableReference> propertyVariables, bool shouldTreatEmptyStringAsNull)
        {
            yield return DeserializeIntoObjectProperties(propertySerializations, jsonProperty, propertyVariables, shouldTreatEmptyStringAsNull, options);
            // in the case here, this line returns an empty statement, we only want the value here
            yield return DeserializeValue(additionalPropertiesSerialization.ValueSerialization!, jsonProperty.Value, options, out var value);
            var additionalPropertiesStatement = dictionary.Add(jsonProperty.Name, value);

            yield return Serializations.WrapInCheckNotWire(
                additionalPropertiesSerialization,
                options?.Format,
                additionalPropertiesStatement);
        }

        private static MethodBodyStatement DeserializeIntoObjectProperties(IEnumerable<JsonPropertySerialization> propertySerializations, JsonPropertyExpression jsonProperty, IReadOnlyDictionary<JsonPropertySerialization, VariableReference> propertyVariables, bool shouldTreatEmptyStringAsNull, ModelReaderWriterOptionsExpression? options)
            => propertySerializations
                .Select(p => new IfStatement(jsonProperty.NameEquals(p.SerializedName))
                {
                    DeserializeIntoObjectProperty(p, jsonProperty, propertyVariables, shouldTreatEmptyStringAsNull, options)
                })
                .ToArray();

        private static MethodBodyStatement DeserializeIntoObjectProperty(JsonPropertySerialization jsonPropertySerialization, JsonPropertyExpression jsonProperty, IReadOnlyDictionary<JsonPropertySerialization, VariableReference> propertyVariables, bool shouldTreatEmptyStringAsNull, ModelReaderWriterOptionsExpression? options)
        {
            // write the deserialization hook
            if (jsonPropertySerialization.CustomDeserializationMethodName is { } deserializationMethodName)
            {
                return new[]
                {
                    CreatePropertyNullCheckStatement(jsonPropertySerialization, jsonProperty, propertyVariables, shouldTreatEmptyStringAsNull),
                    InvokeCustomDeserializationMethod(deserializationMethodName, jsonProperty, propertyVariables[jsonPropertySerialization].Declaration),
                    Continue
                };
            }

            // Reading a property value
            if (jsonPropertySerialization.ValueSerialization is not null)
            {
                List<MethodBodyStatement> statements = new List<MethodBodyStatement>
                {
                    CreatePropertyNullCheckStatement(jsonPropertySerialization, jsonProperty, propertyVariables, shouldTreatEmptyStringAsNull),
                    DeserializeValue(jsonPropertySerialization.ValueSerialization, jsonProperty.Value, options, out var value)
                };

                AssignValueStatement assignStatement = TypeFactory.IsReadOnlyMemory(jsonPropertySerialization.SerializedType!)
                    ? Assign(propertyVariables[jsonPropertySerialization], New.Instance(jsonPropertySerialization.SerializedType!, value))
                    : Assign(propertyVariables[jsonPropertySerialization], value);
                statements.Add(assignStatement);
                statements.Add(Continue);
                return statements;
            }

            // Reading a nested object
            if (jsonPropertySerialization.PropertySerializations is not null)
            {
                return new[]
                {
                    CreatePropertyNullCheckStatement(jsonPropertySerialization, jsonProperty, propertyVariables, shouldTreatEmptyStringAsNull),
                    new ForeachStatement("property", jsonProperty.Value.EnumerateObject(), out var nestedItemVariable)
                    {
                        DeserializeIntoObjectProperties(jsonPropertySerialization.PropertySerializations, new JsonPropertyExpression(nestedItemVariable), propertyVariables, shouldTreatEmptyStringAsNull, options)
                    },
                    Continue
                };
            }

            throw new InvalidOperationException($"Either {nameof(JsonPropertySerialization.ValueSerialization)} must not be null or {nameof(JsonPropertySerialization.PropertySerializations)} must not be null.");
        }

        private static MethodBodyStatement CreatePropertyNullCheckStatement(JsonPropertySerialization jsonPropertySerialization, JsonPropertyExpression jsonProperty, IReadOnlyDictionary<JsonPropertySerialization, VariableReference> propertyVariables, bool shouldTreatEmptyStringAsNull)
        {
            if (jsonPropertySerialization.CustomDeserializationMethodName is not null)
            {
                // if we have the deserialization hook here, we do not need to do any check, all these checks should be taken care of by the hook
                return EmptyStatement;
            }

            var checkEmptyProperty = GetCheckEmptyPropertyValueExpression(jsonProperty, jsonPropertySerialization, shouldTreatEmptyStringAsNull);
            var serializedType = jsonPropertySerialization.SerializedType;
            if (serializedType?.IsNullable == true)
            {
                // we only assign null when it is not a collection if we have DeserializeNullCollectionAsNullValue configuration is off
                // specially when it is required, we assign ChangeTrackingList because for optional lists we are already doing that
                if (!TypeFactory.IsCollectionType(serializedType) || Configuration.DeserializeNullCollectionAsNullValue)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        Assign(propertyVariables[jsonPropertySerialization], Null),
                        Continue
                    };
                }

                if (jsonPropertySerialization.IsRequired && !TypeFactory.IsReadOnlyMemory(serializedType))
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        Assign(propertyVariables[jsonPropertySerialization], New.Instance(TypeFactory.GetPropertyImplementationType(serializedType))),
                        Continue
                    };
                }

                return new IfStatement(checkEmptyProperty)
                {
                    Continue
                };
            }

            // even if ReadOnlyMemory is required we leave the list empty if the payload doesn't have it
            if ((!jsonPropertySerialization.IsRequired || (serializedType is not null && TypeFactory.IsReadOnlyMemory(serializedType))) &&
                serializedType?.Equals(typeof(JsonElement)) != true && // JsonElement handles nulls internally
                serializedType?.Equals(typeof(string)) != true) //https://github.com/Azure/autorest.csharp/issues/922
            {
                if (jsonPropertySerialization.PropertySerializations is null)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        Continue
                    };
                }

                return new IfStatement(checkEmptyProperty)
                {
                    jsonProperty.ThrowNonNullablePropertyIsNull(),
                    Continue
                };
            }

            return EmptyStatement;
        }

        private static BoolExpression GetCheckEmptyPropertyValueExpression(JsonPropertyExpression jsonProperty, JsonPropertySerialization jsonPropertySerialization, bool shouldTreatEmptyStringAsNull)
        {
            var jsonElement = jsonProperty.Value;
            if (!shouldTreatEmptyStringAsNull)
            {
                return jsonElement.ValueKindEqualsNull();
            }

            if (jsonPropertySerialization.ValueSerialization is not JsonValueSerialization { Type.IsFrameworkType: true } valueSerialization)
            {
                return jsonElement.ValueKindEqualsNull();
            }

            if (!Configuration.IntrinsicTypesToTreatEmptyStringAsNull.Contains(valueSerialization.Type.FrameworkType.Name))
            {
                return jsonElement.ValueKindEqualsNull();
            }

            return Or(jsonElement.ValueKindEqualsNull(), And(jsonElement.ValueKindEqualsString(), Equal(jsonElement.GetString().Length, Int(0))));

        }

        /// Collects a list of properties being read from all level of object hierarchy
        private static void CollectPropertiesForDeserialization(IDictionary<JsonPropertySerialization, VariableReference> propertyVariables, IEnumerable<JsonPropertySerialization> jsonProperties)
        {
            foreach (JsonPropertySerialization jsonProperty in jsonProperties)
            {
                if (jsonProperty.ValueSerialization is { } valueSerialization)
                {
                    var type = jsonProperty.SerializedType is not null && TypeFactory.IsCollectionType(jsonProperty.SerializedType)
                        ? jsonProperty.SerializedType
                        : valueSerialization.Type;
                    var propertyDeclaration = new CodeWriterDeclaration(jsonProperty.SerializedName.ToVariableName());
                    propertyVariables.Add(jsonProperty, new VariableReference(type, propertyDeclaration));
                }
                else if (jsonProperty.PropertySerializations != null)
                {
                    CollectPropertiesForDeserialization(propertyVariables, jsonProperty.PropertySerializations);
                }
            }
        }

        public static MethodBodyStatement BuildDeserializationForMethods(JsonSerialization serialization, bool async, ValueExpression? variable, StreamExpression stream, bool isBinaryData, ModelReaderWriterOptionsExpression? options)
        {
            if (isBinaryData)
            {
                var callFromStream = BinaryDataExpression.FromStream(stream, async);
                var variableExpression = variable is not null ? new BinaryDataExpression(variable) : null;
                return AssignOrReturn(variableExpression, callFromStream);
            }

            var declareDocument = UsingVar("document", JsonDocumentExpression.Parse(stream, async), out var document);
            var deserializeValueBlock = DeserializeValue(serialization, document.RootElement, options, out var value);

            if (!serialization.IsNullable)
            {
                return new[] { declareDocument, deserializeValueBlock, AssignOrReturn(variable, value) };
            }

            return new MethodBodyStatement[]
            {
                declareDocument,
                new IfElseStatement
                (
                    document.RootElement.ValueKindEqualsNull(),
                    AssignOrReturn(variable, Null),
                    new[]{deserializeValueBlock, AssignOrReturn(variable, value)}
                )
            };
        }

        // TODO -- make options parameter non-nullable again when we remove the `use-model-reader-writer` flag
        public static MethodBodyStatement DeserializeValue(JsonSerialization serialization, JsonElementExpression element, ModelReaderWriterOptionsExpression? options, out ValueExpression value)
        {
            switch (serialization)
            {
                case JsonArraySerialization jsonReadOnlyMemory when TypeFactory.IsArray(jsonReadOnlyMemory.Type):
                    var readOnlyMemory = new VariableReference(jsonReadOnlyMemory.Type, "array");
                    value = readOnlyMemory;
                    VariableReference index = new VariableReference(typeof(int), "index");

                    return new MethodBodyStatement[]
                    {
                        Declare(index, Int(0)),
                        Declare(readOnlyMemory, New.Array(TypeFactory.GetElementType(jsonReadOnlyMemory.Type), element.GetArrayLength())),
                        new ForeachStatement("item", element.EnumerateArray(), out var readOnlyMemoryItem)
                        {
                            DeserializeArrayItem(jsonReadOnlyMemory, value, new JsonElementExpression(readOnlyMemoryItem), options, index),
                            Increment(index)
                        }
                    };

                case JsonArraySerialization jsonArray:
                    var array = new VariableReference(jsonArray.Type, "array");
                    value = array;

                    return new MethodBodyStatement[]
                    {
                        Declare(array, New.Instance(jsonArray.Type)),
                        new ForeachStatement("item", element.EnumerateArray(), out var arrayItem)
                        {
                            DeserializeArrayItem(jsonArray, value, new JsonElementExpression(arrayItem), options),
                        }
                    };

                case JsonDictionarySerialization jsonDictionary:
                    var deserializeDictionaryStatement = new MethodBodyStatement[]
                    {
                        Declare("dictionary", New.Dictionary(jsonDictionary.Type.Arguments[0], jsonDictionary.Type.Arguments[1]), out var dictionary),
                        new ForeachStatement("property", element.EnumerateObject(), out var property)
                        {
                            DeserializeDictionaryValue(jsonDictionary.ValueSerialization, dictionary, new JsonPropertyExpression(property), options)
                        }
                    };
                    value = dictionary;
                    return deserializeDictionaryStatement;

                case JsonValueSerialization { Options: JsonSerializationOptions.UseManagedServiceIdentityV3 } valueSerialization:
                    var declareSerializeOptions = Var("serializeOptions", New.JsonSerializerOptions(), out var serializeOptions);
                    value = GetDeserializeValueExpression(element, valueSerialization.Type, options, valueSerialization.Format, serializeOptions);
                    return declareSerializeOptions;

                case JsonValueSerialization valueSerialization:
                    value = GetDeserializeValueExpression(element, valueSerialization.Type, options, valueSerialization.Format);
                    return EmptyStatement;

                default:
                    throw new InvalidOperationException($"{serialization.GetType()} is not supported.");
            }
        }

        private static MethodBodyStatement DeserializeArrayItem(JsonArraySerialization serialization, ValueExpression arrayVariable, JsonElementExpression arrayItemVariable, ModelReaderWriterOptionsExpression? options, ValueExpression? index = null)
        {
            bool isArray = index is not null;

            List<MethodBodyStatement> statements = new List<MethodBodyStatement>();

            MethodBodyStatement deserializeAndAssign = new[]
            {
                DeserializeValue(serialization.ValueSerialization, arrayItemVariable, options, out var value),
                isArray ? InvokeArrayElementAssignment(arrayVariable, index!, value) : InvokeListAdd(arrayVariable, value)
            };

            if (CollectionItemRequiresNullCheckInSerialization(serialization.ValueSerialization))
            {
                statements.Add(new IfElseStatement(
                    arrayItemVariable.ValueKindEqualsNull(),
                    isArray ? InvokeArrayElementAssignment(arrayVariable, index!, Null) : InvokeListAdd(arrayVariable, Null),
                    deserializeAndAssign));
            }
            else
            {
                statements.Add(deserializeAndAssign);
            }

            return statements;
        }

        private static MethodBodyStatement DeserializeDictionaryValue(JsonSerialization serialization, DictionaryExpression dictionary, JsonPropertyExpression property, ModelReaderWriterOptionsExpression? options)
        {
            var deserializeValueBlock = new[]
            {
                DeserializeValue(serialization, property.Value, options, out var value),
                dictionary.Add(property.Name, value)
            };

            if (CollectionItemRequiresNullCheckInSerialization(serialization))
            {
                return new IfElseStatement
                (
                    property.Value.ValueKindEqualsNull(),
                    dictionary.Add(property.Name, Null),
                    deserializeValueBlock
                );
            }

            return deserializeValueBlock;
        }

        public static ValueExpression GetDeserializeValueExpression(JsonElementExpression element, CSharpType serializationType, ModelReaderWriterOptionsExpression? options, SerializationFormat serializationFormat = SerializationFormat.Default, ValueExpression? serializerOptions = null)
        {
            if (serializationType.SerializeAs != null)
            {
                return new CastExpression(GetFrameworkTypeValueExpression(serializationType.SerializeAs, element, serializationFormat, serializationType), serializationType);
            }

            if (serializationType.IsFrameworkType)
            {
                var frameworkType = serializationType.FrameworkType;
                if (frameworkType == typeof(Nullable<>))
                {
                    frameworkType = serializationType.Arguments[0].FrameworkType;
                }

                return GetFrameworkTypeValueExpression(frameworkType, element, serializationFormat, serializationType);
            }

            return GetDeserializeImplementation(serializationType.Implementation, element, options, serializerOptions);
        }

        private static ValueExpression GetDeserializeImplementation(TypeProvider implementation, JsonElementExpression element, ModelReaderWriterOptionsExpression? options, ValueExpression? serializerOptions)
        {
            switch (implementation)
            {
                case SystemObjectType systemObjectType when IsCustomJsonConverterAdded(systemObjectType.SystemType):
                    return InvokeJsonSerializerDeserializeMethod(element, implementation.Type, serializerOptions);

                case Resource { ResourceData: SerializableObjectType resourceDataType } resource:
                    return New.Instance(resource.Type, new MemberExpression(null, "Client"), SerializableObjectTypeExpression.Deserialize(resourceDataType, element));

                case MgmtObjectType mgmtObjectType when TypeReferenceTypeChooser.HasMatch(mgmtObjectType.ObjectSchema):
                    return InvokeJsonSerializerDeserializeMethod(element, implementation.Type);

                case SerializableObjectType type:
                    return SerializableObjectTypeExpression.Deserialize(type, element, options);

                case EnumType clientEnum:
                    var value = GetFrameworkTypeValueExpression(clientEnum.ValueType.FrameworkType, element, SerializationFormat.Default, null);
                    return EnumExpression.ToEnum(clientEnum, value);

                default:
                    throw new NotSupportedException($"No deserialization logic exists for {implementation.Declaration.Name}");
            }
        }

        private static ValueExpression GetOptional(PropertySerialization jsonPropertySerialization, TypedValueExpression variable)
        {
            var sourceType = variable.Type;
            if (!sourceType.IsFrameworkType || jsonPropertySerialization.SerializationConstructorParameterName == "serializedAdditionalRawData")
            {
                return variable;
            }
            else if (!jsonPropertySerialization.IsRequired)
            {
                return InvokeOptional.FallBackToChangeTrackingCollection(variable, jsonPropertySerialization.SerializedType);
            }

            return variable;
        }

        public static ValueExpression GetFrameworkTypeValueExpression(Type frameworkType, JsonElementExpression element, SerializationFormat format, CSharpType? serializationType)
        {
            if (frameworkType == typeof(ETag) ||
                frameworkType == typeof(Uri) ||
                frameworkType == typeof(ResourceIdentifier) ||
                frameworkType == typeof(ResourceType) ||
                frameworkType == typeof(ContentType) ||
                frameworkType == typeof(RequestMethod) ||
                frameworkType == typeof(AzureLocation) ||
                frameworkType == typeof(ExtendedLocationType))
            {
                return New.Instance(frameworkType, element.GetString());
            }

            if (frameworkType == typeof(IPAddress))
            {
                return new InvokeStaticMethodExpression(typeof(IPAddress), nameof(IPAddress.Parse), new[] { element.GetString() });
            }

            if (frameworkType == typeof(BinaryData))
            {
                return format is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                    ? BinaryDataExpression.FromBytes(element.GetBytesFromBase64(format.ToFormatSpecifier()))
                    : BinaryDataExpression.FromString(element.GetRawText());
            }

            if (IsCustomJsonConverterAdded(frameworkType) && serializationType is not null)
            {
                return InvokeJsonSerializerDeserializeMethod(element, serializationType);
            }

            if (frameworkType == typeof(JsonElement))
                return element.InvokeClone();
            if (frameworkType == typeof(object))
                return element.GetObject();
            if (frameworkType == typeof(bool))
                return element.GetBoolean();
            if (frameworkType == typeof(char))
                return element.GetChar();

            if (frameworkType == typeof(sbyte))
                return element.GetSByte();
            if (frameworkType == typeof(byte))
                return element.GetByte();
            if (frameworkType == typeof(short))
                return element.GetInt16();
            if (frameworkType == typeof(int))
                return element.GetInt32();
            if (frameworkType == typeof(long))
                return element.GetInt64();
            if (frameworkType == typeof(float))
                return element.GetSingle();
            if (frameworkType == typeof(double))
                return element.GetDouble();
            if (frameworkType == typeof(decimal))
                return element.GetDecimal();
            if (frameworkType == typeof(string))
                return element.GetString();
            if (frameworkType == typeof(Guid))
                return element.GetGuid();
            if (frameworkType == typeof(byte[]))
                return element.GetBytesFromBase64(format.ToFormatSpecifier());

            if (frameworkType == typeof(DateTimeOffset))
            {
                return format == SerializationFormat.DateTime_Unix
                    ? DateTimeOffsetExpression.FromUnixTimeSeconds(element.GetInt64())
                    : element.GetDateTimeOffset(format.ToFormatSpecifier());
            }

            if (frameworkType == typeof(DateTime))
                return element.GetDateTime();
            if (frameworkType == typeof(TimeSpan))
            {
                if (format == SerializationFormat.Duration_Seconds)
                {
                    return TimeSpanExpression.FromSeconds(element.GetInt32());
                }

                if (format == SerializationFormat.Duration_Seconds_Float)
                {
                    return TimeSpanExpression.FromSeconds(element.GetDouble());
                }

                return element.GetTimeSpan(format.ToFormatSpecifier());
            }

            throw new NotSupportedException($"Framework type {frameworkType} is not supported, please add `CodeGenMemberSerializationHooks` to specify the serialization of this type with the customized property");
        }

        private static MethodBodyStatement InvokeListAdd(ValueExpression list, ValueExpression value)
            => new InvokeInstanceMethodStatement(list, nameof(List<object>.Add), value);

        private static MethodBodyStatement InvokeArrayElementAssignment(ValueExpression array, ValueExpression index, ValueExpression value)
            => Assign(new ArrayElementExpression(array, index), value);

        private static ValueExpression InvokeJsonSerializerDeserializeMethod(JsonElementExpression element, CSharpType serializationType, ValueExpression? options = null)
        {
            var arguments = options is null
                ? new[] { element.GetRawText() }
                : new[] { element.GetRawText(), options };
            return new InvokeStaticMethodExpression(typeof(JsonSerializer), nameof(JsonSerializer.Deserialize), arguments, new[] { serializationType });
        }

        private static MethodBodyStatement InvokeJsonSerializerSerializeMethod(ValueExpression writer, ValueExpression value)
            => new InvokeStaticMethodStatement(typeof(JsonSerializer), nameof(JsonSerializer.Serialize), new[] { writer, value });

        private static MethodBodyStatement InvokeJsonSerializerSerializeMethod(ValueExpression writer, ValueExpression value, ValueExpression options)
            => new InvokeStaticMethodStatement(typeof(JsonSerializer), nameof(JsonSerializer.Serialize), new[] { writer, value, options });

        private static bool IsCustomJsonConverterAdded(Type type)
            => type.GetCustomAttributes().Any(a => a.GetType() == typeof(JsonConverterAttribute));

        public static bool CollectionItemRequiresNullCheckInSerialization(JsonSerialization serialization) =>
            serialization is { IsNullable: true } and JsonValueSerialization { Type: { IsValueType: true } } || // nullable value type, like int?
            serialization is JsonArraySerialization or JsonDictionarySerialization || // list or dictionary
            serialization is JsonValueSerialization jsonValueSerialization &&
            jsonValueSerialization is { Type: { IsValueType: false, IsFrameworkType: true } } && // framework reference type, e.g. byte[]
            jsonValueSerialization.Type.FrameworkType != typeof(string) && // excluding string, because JsonElement.GetString() can handle null
            jsonValueSerialization.Type.FrameworkType != typeof(byte[]); // excluding byte[], because JsonElement.GetBytesFromBase64() can handle null
    }
}
