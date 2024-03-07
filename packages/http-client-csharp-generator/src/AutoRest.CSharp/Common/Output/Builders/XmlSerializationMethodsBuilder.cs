// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.ResourceManager.Models;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Builders
{
    internal static class XmlSerializationMethodsBuilder
    {
        public static IEnumerable<Method> BuildXmlSerializationMethods(XmlObjectSerialization serialization)
        {
            // a private helper method with the options to do the full xml serialization
            var xmlWriter = new XmlWriterExpression(KnownParameters.Serializations.XmlWriter);
            var nameHint = (ValueExpression)KnownParameters.Serializations.NameHint;
            var options = new ModelReaderWriterOptionsExpression(KnownParameters.Serializations.Options);
            if (Configuration.UseModelReaderWriter)
            {
                yield return new Method
                (
                    new MethodSignature(serialization.WriteXmlMethodName, null, null, MethodSignatureModifiers.Private, null, null, new[] { KnownParameters.Serializations.XmlWriter, KnownParameters.Serializations.NameHint, KnownParameters.Serializations.Options }),
                    WriteObject(serialization, xmlWriter, nameHint, options).ToArray()
                );

                yield return new Method
                (
                    new MethodSignature(nameof(IXmlSerializable.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.XmlWriter, KnownParameters.Serializations.NameHint }, ExplicitInterface: typeof(IXmlSerializable)),
                    This.Invoke(serialization.WriteXmlMethodName, new[] { xmlWriter, nameHint, ModelReaderWriterOptionsExpression.Wire })
                );
            }
            else
            {
                yield return new Method
                (
                    new MethodSignature(nameof(IXmlSerializable.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { KnownParameters.Serializations.XmlWriter, KnownParameters.Serializations.NameHint }, ExplicitInterface: typeof(IXmlSerializable)),
                    WriteObject(serialization, xmlWriter, nameHint, null).ToArray()
                );
            }
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> WriteObject(XmlObjectSerialization objectSerialization, XmlWriterExpression xmlWriter, ValueExpression nameHint, ModelReaderWriterOptionsExpression? options)
        {
            yield return xmlWriter.WriteStartElement(NullCoalescing(nameHint, Literal(objectSerialization.Name)));

            foreach (XmlObjectAttributeSerialization serialization in objectSerialization.Attributes)
            {
                yield return Serializations.WrapInCheckNotWire(
                    serialization,
                    options?.Format,
                    InvokeOptional.WrapInIsDefined(serialization, WrapInNullCheck(serialization, new[]
                    {
                        xmlWriter.WriteStartAttribute(serialization.SerializedName),
                        SerializeValueExpression(xmlWriter, serialization.ValueSerialization, serialization.Value),
                        xmlWriter.WriteEndAttribute()
                    })));
            }

            foreach (XmlObjectElementSerialization serialization in objectSerialization.Elements)
            {
                yield return Serializations.WrapInCheckNotWire(
                    serialization,
                    options?.Format,
                    InvokeOptional.WrapInIsDefined(serialization, WrapInNullCheck(serialization, SerializeExpression(xmlWriter, serialization.ValueSerialization, serialization.Value))));
            }

            foreach (XmlObjectArraySerialization serialization in objectSerialization.EmbeddedArrays)
            {
                yield return Serializations.WrapInCheckNotWire(
                    serialization,
                    options?.Format,
                    InvokeOptional.WrapInIsDefined(serialization, WrapInNullCheck(serialization, SerializeExpression(xmlWriter, serialization.ArraySerialization, serialization.Value))));
            }

            if (objectSerialization.ContentSerialization is { } contentSerialization)
            {
                yield return Serializations.WrapInCheckNotWire(
                    contentSerialization,
                    options?.Format,
                    SerializeValueExpression(xmlWriter, contentSerialization.ValueSerialization, contentSerialization.Value));
            }

            yield return xmlWriter.WriteEndElement();
        }

        private static MethodBodyStatement WrapInNullCheck(PropertySerialization serialization, MethodBodyStatement statement)
        {
            if (serialization.SerializedType is { IsNullable: true } serializedType)
            {
                if (TypeFactory.IsCollectionType(serializedType) && serialization.IsRequired)
                {
                    return new IfElseStatement(And(NotEqual(serialization.Value, Null), InvokeOptional.IsCollectionDefined(serialization.Value)), statement, null);
                }

                return new IfElseStatement(NotEqual(serialization.Value, Null), statement, null);
            }

            return statement;
        }

        public static MethodBodyStatement SerializeExpression(XmlWriterExpression xmlWriter, XmlElementSerialization serialization, ValueExpression expression)
            => serialization switch
            {
                XmlArraySerialization array => SerializeArray(xmlWriter, array, new EnumerableExpression(TypeFactory.GetElementType(array.Type), expression)).AsStatement(),
                XmlDictionarySerialization dictionary => SerializeDictionary(xmlWriter, dictionary, new DictionaryExpression(dictionary.Type.Arguments[0], dictionary.Type.Arguments[1], expression)),
                XmlElementValueSerialization value => SerializeElement(xmlWriter, value, expression),
                _ => throw new NotSupportedException()
            };

        private static IEnumerable<MethodBodyStatement> SerializeArray(XmlWriterExpression xmlWriter, XmlArraySerialization arraySerialization, EnumerableExpression array)
        {
            if (arraySerialization.Wrapped)
            {
                yield return xmlWriter.WriteStartElement(arraySerialization.Name);
            }

            yield return new ForeachStatement("item", array, out var item)
            {
                SerializeExpression(xmlWriter, arraySerialization.ValueSerialization, item)
            };

            if (arraySerialization.Wrapped)
            {
                yield return xmlWriter.WriteEndElement();
            }
        }

        private static MethodBodyStatement SerializeDictionary(XmlWriterExpression xmlWriter, XmlDictionarySerialization dictionarySerialization, DictionaryExpression dictionary)
        {
            return new ForeachStatement("pair", dictionary, out var pair)
            {
                SerializeExpression(xmlWriter, dictionarySerialization.ValueSerialization, pair.Value)
            };
        }

        private static MethodBodyStatement SerializeElement(XmlWriterExpression xmlWriter, XmlElementValueSerialization elementValueSerialization, ValueExpression element)
        {
            var type = elementValueSerialization.Value.Type;
            string elementName = elementValueSerialization.Name;

            if (type is { IsFrameworkType: false, Implementation: ObjectType })
            {
                return xmlWriter.WriteObjectValue(element, elementName);
            }

            if (type.IsFrameworkType && type.FrameworkType == typeof(object))
            {
                return xmlWriter.WriteObjectValue(element, elementName);
            }

            return new[]
            {
                xmlWriter.WriteStartElement(elementName),
                SerializeValueExpression(xmlWriter, elementValueSerialization.Value, element),
                xmlWriter.WriteEndElement()
            };
        }

        private static MethodBodyStatement SerializeValueExpression(XmlWriterExpression xmlWriter, XmlValueSerialization valueSerialization, ValueExpression value)
        {
            var type = valueSerialization.Type;
            value = value.NullableStructValue(type);

            if (!type.IsFrameworkType)
            {
                return type.Implementation switch
                {
                    EnumType clientEnum => xmlWriter.WriteValue(new EnumExpression(clientEnum, value).ToSerial()),
                    _ => throw new NotSupportedException("Object type references are only supported as elements")
                };
            }

            var frameworkType = type.FrameworkType;
            if (frameworkType == typeof(object))
            {
                throw new NotSupportedException("Object references are only supported as elements");
            }

            return xmlWriter.WriteValue(value, frameworkType, valueSerialization.Format);

        }

        public static Method BuildDeserialize(TypeDeclarationOptions declaration, XmlObjectSerialization serialization)
        {
            var methodName = $"Deserialize{declaration.Name}";
            var signature = Configuration.UseModelReaderWriter ?
                new MethodSignature(methodName, null, null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, serialization.Type, null, new[] { KnownParameters.Serializations.XElement, KnownParameters.Serializations.OptionalOptions }) :
                new MethodSignature(methodName, null, null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, serialization.Type, null, new[] { KnownParameters.Serializations.XElement });

            return Configuration.UseModelReaderWriter ?
                new Method(signature, BuildDeserializeBody(serialization, new XElementExpression(KnownParameters.Serializations.XElement), new ModelReaderWriterOptionsExpression(KnownParameters.Serializations.OptionalOptions)).ToArray()) :
                new Method(signature, BuildDeserializeBody(serialization, new XElementExpression(KnownParameters.Serializations.XElement), null).ToArray());
        }

        // TODO -- make the options parameter non-nullable again when we remove the `UseModelReaderWriter` flag.
        private static IEnumerable<MethodBodyStatement> BuildDeserializeBody(XmlObjectSerialization objectSerialization, XElementExpression element, ModelReaderWriterOptionsExpression? options)
        {
            if (options != null)
            {
                yield return AssignIfNull(options, ModelReaderWriterOptionsExpression.Wire);
                yield return EmptyLine;
            }

            var propertyVariables = new Dictionary<XmlPropertySerialization, VariableReference>();

            CollectProperties(propertyVariables, objectSerialization);

            foreach (var (property, variable) in propertyVariables)
            {
                yield return new DeclareVariableStatement(variable.Type, variable.Declaration, Default);
            }

            foreach (XmlObjectAttributeSerialization attribute in objectSerialization.Attributes)
            {
                var attributeVariableName = attribute.SerializationConstructorParameterName + "Attribute";
                yield return new IfStatement(Is(element.Attribute(attribute.SerializedName), attributeVariableName, out var attributeVariable))
                {
                    Assign(propertyVariables[attribute], DeserializeValue(attribute.ValueSerialization, attributeVariable))
                };
            }

            foreach (XmlObjectElementSerialization elem in objectSerialization.Elements)
            {
                yield return BuildDeserialization(elem.ValueSerialization, propertyVariables[elem], element);
            }

            foreach (XmlObjectArraySerialization embeddedArray in objectSerialization.EmbeddedArrays)
            {
                yield return BuildDeserialization(embeddedArray.ArraySerialization, propertyVariables[embeddedArray], element);
            }

            if (objectSerialization.ContentSerialization is { } contentSerialization)
            {
                yield return Assign(propertyVariables[contentSerialization], DeserializeValue(contentSerialization.ValueSerialization, element));
            }

            var objectType = (ObjectType)objectSerialization.Type.Implementation;
            var parameterValues = propertyVariables.ToDictionary(v => v.Key.SerializationConstructorParameterName, v => (ValueExpression)v.Value);

            var arguments = new List<ValueExpression>();
            foreach (var parameter in objectType.SerializationConstructor.Signature.Parameters)
            {
                if (parameterValues.TryGetValue(parameter.Name, out var argument))
                    arguments.Add(argument);
                else
                {
                    // this must be the raw data property
                    arguments.Add(new PositionalParameterReference(parameter.Name, Null));
                }
            }

            yield return Return(New.Instance(objectSerialization.Type, arguments));
        }

        public static MethodBodyStatement BuildDeserializationForMethods(XmlElementSerialization serialization, ValueExpression? variable, StreamExpression stream)
        {
            return new[]
            {
                Var("document", XDocumentExpression.Load(stream, LoadOptions.PreserveWhitespace), out var document),
                BuildDeserialization(serialization, variable, document)
            };
        }

        private static MethodBodyStatement BuildDeserialization(XmlElementSerialization serialization, ValueExpression? variable, XContainerExpression document)
        {
            if (serialization is XmlArraySerialization { Wrapped: false } arraySerialization)
            {
                var deserializedDocument = BuildDeserializationForArray(arraySerialization, document, out var deserialization);
                return new[] { deserialization, AssignOrReturn(variable, deserializedDocument) };
            }

            var elementName = serialization.Name.ToVariableName() + "Element";
            return new IfStatement(Is(document.Element(serialization.Name), elementName, out var element))
            {
                BuildDeserializationForXContainer(serialization, element, out var deserializedContainer),
                AssignOrReturn(variable, deserializedContainer)
            };
        }

        private static MethodBodyStatement BuildDeserializationForXContainer(XmlElementSerialization serialization, XElementExpression element, out ValueExpression deserializedContainer)
        {
            var deserialization = EmptyStatement;
            switch (serialization)
            {
                case XmlArraySerialization arraySerialization:
                    deserializedContainer = BuildDeserializationForArray(arraySerialization, element, out deserialization);
                    break;

                case XmlDictionarySerialization dictionarySerialization:
                    deserializedContainer = BuildDeserializationForDictionary(dictionarySerialization, element, out deserialization);
                    break;

                case XmlElementValueSerialization valueSerialization:
                    deserializedContainer = DeserializeValue(valueSerialization.Value, element);
                    break;

                default:
                    throw new InvalidOperationException($"Unexpected {nameof(XmlElementSerialization)} type.");
            }

            return deserialization;
        }

        private static ValueExpression BuildDeserializationForArray(XmlArraySerialization arraySerialization, XContainerExpression container, out MethodBodyStatement deserializationStatement)
        {
            deserializationStatement = new MethodBodyStatement[]
            {
                Var("array", New.List(arraySerialization.Type.Arguments[0]), out var array),
                new ForeachStatement("e", container.Elements(arraySerialization.ValueSerialization.Name), out var child)
                {
                    BuildDeserializationForXContainer(arraySerialization.ValueSerialization, new XElementExpression(child), out var deserializedChild),
                    array.Add(deserializedChild)
                }
            };
            return array;
        }

        private static ValueExpression BuildDeserializationForDictionary(XmlDictionarySerialization dictionarySerialization, XContainerExpression container, out MethodBodyStatement deserializationStatement)
        {
            deserializationStatement = new MethodBodyStatement[]
            {
                Var("dictionary", New.Dictionary(dictionarySerialization.Type.Arguments[0], dictionarySerialization.Type.Arguments[1]), out var dictionary),
                new ForeachStatement("e", container.Elements(), out var element)
                {
                    BuildDeserializationForXContainer(dictionarySerialization.ValueSerialization, new XElementExpression(element), out var deserializedElement),
                    dictionary.Add(new XElementExpression(element).Name.LocalName, deserializedElement)
                }
            };
            return dictionary;
        }

        private static ValueExpression DeserializeValue(XmlValueSerialization serialization, ValueExpression value)
        {
            var type = serialization.Type;

            if (type.IsFrameworkType)
            {
                var frameworkType = type.FrameworkType;
                if (frameworkType == typeof(bool) ||
                    frameworkType == typeof(char) ||
                    frameworkType == typeof(short) ||
                    frameworkType == typeof(int) ||
                    frameworkType == typeof(long) ||
                    frameworkType == typeof(float) ||
                    frameworkType == typeof(double) ||
                    frameworkType == typeof(decimal) ||
                    frameworkType == typeof(string)
                )
                {
                    return value.CastTo(type);
                }

                if (frameworkType == typeof(ResourceIdentifier))
                {
                    return New.Instance(typeof(ResourceIdentifier), value.CastTo(typeof(string)));
                }

                if (frameworkType == typeof(SystemData))
                {
                    // XML Deserialization of SystemData isn't supported yet.
                    return Null;
                }

                if (frameworkType == typeof(ResourceType))
                {
                    return value.CastTo(typeof(string));
                }

                if (frameworkType == typeof(Guid))
                {
                    return value is XElementExpression xElement
                        ? New.Instance(typeof(Guid), xElement.Value)
                        : value.CastTo(typeof(Guid));
                }

                if (frameworkType == typeof(Uri))
                {
                    return New.Instance(typeof(Uri), value.CastTo(typeof(string)));
                }

                if (value is XElementExpression element)
                {
                    if (frameworkType == typeof(byte[]))
                    {
                        return element.GetBytesFromBase64Value(serialization.Format.ToFormatSpecifier());
                    }

                    if (frameworkType == typeof(DateTimeOffset))
                    {
                        return element.GetDateTimeOffsetValue(serialization.Format.ToFormatSpecifier());
                    }

                    if (frameworkType == typeof(TimeSpan))
                    {
                        return element.GetTimeSpanValue(serialization.Format.ToFormatSpecifier());
                    }

                    if (frameworkType == typeof(object))
                    {
                        return element.GetObjectValue(serialization.Format.ToFormatSpecifier());
                    }
                }
            }

            switch (type.Implementation)
            {
                case SerializableObjectType serializableObjectType:
                    return SerializableObjectTypeExpression.Deserialize(serializableObjectType, value);

                case EnumType clientEnum when value is XElementExpression xe:
                    return EnumExpression.ToEnum(clientEnum, xe.Value);

                case EnumType clientEnum when value is XAttributeExpression xa:
                    return EnumExpression.ToEnum(clientEnum, xa.Value);

                default:
                    throw new NotSupportedException();
            }
        }

        private static void CollectProperties(Dictionary<XmlPropertySerialization, VariableReference> propertyVariables, XmlObjectSerialization element)
        {
            foreach (var attribute in element.Attributes)
            {
                propertyVariables.Add(attribute, new VariableReference(attribute.Value.Type, attribute.SerializationConstructorParameterName));
            }

            foreach (var attribute in element.Elements)
            {
                propertyVariables.Add(attribute, new VariableReference(attribute.Value.Type, attribute.SerializationConstructorParameterName));
            }

            foreach (var attribute in element.EmbeddedArrays)
            {
                propertyVariables.Add(attribute, new VariableReference(attribute.Value.Type, attribute.SerializationConstructorParameterName));
            }

            if (element.ContentSerialization is { } contentSerialization)
            {
                propertyVariables.Add(contentSerialization, new VariableReference(contentSerialization.Value.Type, contentSerialization.SerializationConstructorParameterName));
            }
        }
    }
}
