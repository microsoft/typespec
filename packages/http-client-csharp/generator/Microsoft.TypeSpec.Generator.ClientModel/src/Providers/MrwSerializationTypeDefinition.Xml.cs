// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Xml;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public partial class MrwSerializationTypeDefinition
    {
        private const string XmlWriteMethodName = "Write";
        private const string XmlModelWriteCoreMethodName = "XmlModelWriteCore";
        private readonly ParameterProvider _xmlWriterParameter = new("writer", $"The XML writer.", typeof(XmlWriter));
        private readonly ParameterProvider _xElementDeserializationParam = new("element", $"The xml element to deserialize.", typeof(XElement));
        private readonly ParameterProvider _nameHintParameter = new("nameHint", $"An optional name hint.", typeof(string));
        private readonly ScopedApi<XElement> _xmlElementParameterSnippet;
        private ScopedApi<XmlWriter> _xmlWriterSnippet;
        private const string ContentTypeHeader = "Content-Type";

        private record XmlPropertyInfo(
            string PropertyName,
            CSharpType PropertyType,
            MemberExpression SerializationExp,
            VariableExpression DeserializationExp,
            XmlSerialization XmlWireInfo,
            SerializationFormat SerializationFormat,
            IEnumerable<AttributeStatement> SerializationAttributes,
            bool IsRequired,
            bool IsReadOnly);

        private record XmlNamespaceInfo(string Namespace, string VariableName, string Prefix, VariableExpression VariableExpression);

        private record XmlPropertyCategories(
            List<XmlPropertyInfo>? AttributeProperties,
            List<XmlPropertyInfo>? ElementProperties,
            XmlPropertyInfo? TextContentProperty,
            Dictionary<string, XmlNamespaceInfo>? Namespaces);

        private XmlPropertyCategories? _allCategorizedXmlProperties;
        private XmlPropertyCategories AllCategorizedXmlProperties => _allCategorizedXmlProperties ??= CategorizeXmlProperties();

        private XmlPropertyCategories? _categorizedXmlProperties;
        private XmlPropertyCategories CategorizedXmlProperties => _categorizedXmlProperties ??= CategorizeXmlProperties(ownPropertiesOnly: true);

        private MethodProvider BuildXmlModelWriteCoreMethod()
        {
            MethodSignatureModifiers modifiers = _isStruct
                ? MethodSignatureModifiers.Private
                : MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            // void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
            return new MethodProvider(
                new MethodSignature(XmlModelWriteCoreMethodName, null, modifiers, null, null, [_xmlWriterParameter, _serializationOptionsParameter]),
                BuildXmlModelWriteCoreMethodBody(),
                this);
        }

        private MethodBodyStatement[] BuildXmlModelWriteCoreMethodBody()
        {
            var categorizedProperties = _shouldOverrideMethods
                ? CategorizedXmlProperties
                : AllCategorizedXmlProperties;
            var statements = new List<MethodBodyStatement>
            {
                CreateValidateFormat(_persistableModelTInterface, WriteAction, ModelReaderWriterOptionsSnippets.XmlFormat),
                MethodBodyStatement.EmptyLine
            };

            if (_shouldOverrideMethods)
            {
                statements.Add(Base.Invoke(XmlModelWriteCoreMethodName, _xmlWriterParameter, _serializationOptionsParameter).Terminate());
            }

            // Write attributes
            if (categorizedProperties.AttributeProperties?.Count > 0)
            {
                foreach (var prop in categorizedProperties.AttributeProperties)
                {
                    statements.Add(CreateXmlWriteAttributeStatement(prop, categorizedProperties.Namespaces));
                }
            }

            // Write elements
            if (categorizedProperties.ElementProperties?.Count > 0)
            {
                foreach (var prop in categorizedProperties.ElementProperties)
                {
                    statements.Add(CreateXmlWriteElementStatement(prop, categorizedProperties.Namespaces));
                }
            }

            // Write unwrapped content
            if (categorizedProperties.TextContentProperty != null)
            {
                statements.Add(CreateXmlWriteTextContentStatement(categorizedProperties.TextContentProperty));
            }

            return [.. statements];
        }

        private MethodProvider BuildXmlWriteMethod()
        {
            // private void Write(XmlWriter writer, ModelReaderWriterOptions options, string nameHint)
            return new MethodProvider(
                new MethodSignature(XmlWriteMethodName, null, MethodSignatureModifiers.Private, null, null, [_xmlWriterParameter, _serializationOptionsParameter, _nameHintParameter]),
                BuildXmlWriteMethodBody(),
                this);
        }

        private MethodBodyStatement[] BuildXmlWriteMethodBody()
        {
            VariableExpression nameHintExpression = _nameHintParameter;
            var nameHintNotNull = nameHintExpression.NotEqual(Null);
            var ns = _inputModel.SerializationOptions.Xml?.Namespace;

            MethodBodyStatement writeStartElement = ns != null
                ? _xmlWriterSnippet.WriteStartElement(ns.Prefix, nameHintExpression, ns.Namespace)
                : _xmlWriterSnippet.WriteStartElement(nameHintExpression);

            return
            [
                new IfStatement(nameHintNotNull) { writeStartElement },
                MethodBodyStatement.EmptyLine,
                This.Invoke(XmlModelWriteCoreMethodName, _xmlWriterParameter, _serializationOptionsParameter).Terminate(),
                MethodBodyStatement.EmptyLine,
                new IfStatement(nameHintNotNull) { _xmlWriterSnippet.WriteEndElement() }
            ];
        }

        private MethodBodyStatement CreateXmlWriteAttributeStatement(XmlPropertyInfo prop, Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            // Check for custom serialization hook
            var serializationHook = GetXmlSerializationHookStatement(prop.PropertyName, prop.SerializationAttributes);
            if (serializationHook != null)
            {
                return WrapInIsDefinedCheck(prop, serializationHook);
            }

            var xmlWireInfo = prop.XmlWireInfo;
            if (xmlWireInfo.Namespace != null && namespaces?.TryGetValue(xmlWireInfo.Namespace.Namespace, out var nsInfo) == true)
            {
                var stringValue = CreateXmlSerializeValueExpression(prop.SerializationExp, prop.PropertyType, prop.SerializationFormat);
                var writeStatement = _xmlWriterSnippet.WriteAttributeString(
                    nsInfo.Prefix,
                    xmlWireInfo.Name,
                    nsInfo.Namespace,
                    prop.SerializationExp);

                return WrapInIsDefinedCheck(prop, writeStatement);
            }

            var statements = new List<MethodBodyStatement>
            {
                _xmlWriterSnippet.WriteStartAttribute(xmlWireInfo.Name),
                CreateXmlWriteValueStatement(prop.SerializationExp, prop.PropertyType, prop.SerializationFormat),
                _xmlWriterSnippet.WriteEndAttribute()
            };

            return WrapInIsDefinedCheck(prop, statements);
        }

        private MethodBodyStatement CreateXmlWriteElementStatement(XmlPropertyInfo prop, Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            // Check for custom serialization hook
            var serializationHook = GetXmlSerializationHookStatement(prop.PropertyName, prop.SerializationAttributes);
            if (serializationHook != null)
            {
                return WrapInIsDefinedCheck(prop, serializationHook);
            }

            if (prop.PropertyType.IsList || prop.PropertyType.IsArray)
            {
                return CreateXmlWriteListStatement(prop, namespaces);
            }

            if (prop.PropertyType.IsDictionary)
            {
                return CreateXmlWriteDictionaryStatement(prop, namespaces);
            }

            return CreateXmlWriteSingleElementStatement(prop, namespaces);
        }

        private MethodBodyStatement CreateXmlWriteSingleElementStatement(
            XmlPropertyInfo prop,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var statements = new List<MethodBodyStatement>();

            if (prop.XmlWireInfo.Namespace != null && namespaces != null && namespaces.TryGetValue(prop.XmlWireInfo.Namespace.Namespace, out var nsInfo))
            {
                statements.Add(_xmlWriterSnippet.WriteStartElement(
                    nsInfo.Prefix,
                    prop.XmlWireInfo.Name,
                    nsInfo.Namespace));
            }
            else
            {
                statements.Add(_xmlWriterSnippet.WriteStartElement(prop.XmlWireInfo.Name));
            }

            statements.AddRange(
                CreateXmlWriteValueStatement(prop.SerializationExp, prop.PropertyType, prop.SerializationFormat),
                _xmlWriterSnippet.WriteEndElement());

            return WrapInIsDefinedCheck(prop, statements);
        }

        private MethodBodyStatement CreateXmlWriteValueStatement(ValueExpression value, CSharpType valueType, SerializationFormat serializationFormat)
        {
            var underlyingType = valueType.IsNullable && valueType.Arguments.Count > 0
                ? valueType.Arguments[0]
                : valueType;

            if (underlyingType.IsList || underlyingType.IsArray)
            {
                return CreateXmlWriteListForEachStatement(value, underlyingType.ElementType, null, null, serializationFormat, null);
            }

            if (underlyingType.IsDictionary)
            {
                return CreateXmlWriteDictionaryForEachStatement(value, underlyingType.Arguments[0], underlyingType.Arguments[1], serializationFormat);
            }

            if (!underlyingType.IsFrameworkType)
            {
                return underlyingType.IsEnum
                    ? _xmlWriterSnippet.WriteValue(CreateXmlSerializeValueExpression(value, valueType, serializationFormat))
                    : _xmlWriterSnippet.WriteObjectValue(value.As(valueType), _serializationOptionsParameter);
            }

            return underlyingType.FrameworkType switch
            {
                Type t when (t == typeof(DateTimeOffset) || t == typeof(TimeSpan)) && serializationFormat.ToFormatSpecifier() is string formatSpecifier
                    => _xmlWriterSnippet.WriteStringValue(value, formatSpecifier),
                Type t when (t == typeof(byte[]) || t == typeof(BinaryData)) && serializationFormat is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                    => _xmlWriterSnippet.WriteBase64StringValue(t == typeof(BinaryData)
                    ? value.As<BinaryData>().ToArray()
                    : value,
                    serializationFormat.ToFormatSpecifier()),
                _ => _xmlWriterSnippet.WriteValue(CreateXmlSerializeValueExpression(value, valueType, serializationFormat))
            };
        }

        private MethodBodyStatement CreateXmlWriteListStatement(
            XmlPropertyInfo prop,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var elementType = prop.PropertyType.ElementType;
            var xmlWireInfo = prop.XmlWireInfo;
            var statements = new List<MethodBodyStatement>();

            // If not unwrapped, write the wrapper element
            if (xmlWireInfo.Unwrapped != true)
            {
                if (xmlWireInfo.Namespace != null && namespaces != null && namespaces.TryGetValue(xmlWireInfo.Namespace.Namespace, out var nsInfo))
                {
                    statements.Add(_xmlWriterSnippet.WriteStartElement(
                        nsInfo.Prefix,
                        xmlWireInfo.Name,
                        nsInfo.Namespace));
                }
                else
                {
                    statements.Add(_xmlWriterSnippet.WriteStartElement(xmlWireInfo.Name));
                }
            }

            statements.Add(CreateXmlWriteListForEachStatement(prop.SerializationExp, elementType, xmlWireInfo.ItemsName, xmlWireInfo.ItemsNamespace, prop.SerializationFormat, namespaces));

            // If not unwrapped, write the end element
            if (xmlWireInfo.Unwrapped != true)
            {
                statements.Add(_xmlWriterSnippet.WriteEndElement());
            }

            return WrapInIsDefinedCheck(prop, statements);
        }

        private ForEachStatement CreateXmlWriteListForEachStatement(
            ValueExpression collection,
            CSharpType elementType,
            string? itemsName,
            XmlSerializationNamespace? itemsNamespace,
            SerializationFormat serializationFormat,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            return new ForEachStatement(elementType, "item", collection, false, out var itemVariable)
            {
                CreateXmlWriteItemStatement(itemVariable, elementType, itemsName, itemsNamespace, serializationFormat, namespaces)
            };
        }

        private MethodBodyStatement CreateXmlWriteItemStatement(
            VariableExpression itemVariable,
            CSharpType itemType,
            string? itemsName,
            XmlSerializationNamespace? itemsNamespace,
            SerializationFormat serializationFormat,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var statements = new List<MethodBodyStatement>();
            var elementName = itemsName ?? itemType.Name;

            // Write start element for item
            if (itemsNamespace != null && namespaces != null && namespaces.TryGetValue(itemsNamespace.Namespace, out var nsInfo))
            {
                statements.Add(_xmlWriterSnippet.WriteStartElement(
                    nsInfo.Prefix,
                    elementName,
                    nsInfo.Namespace));
            }
            else
            {
                statements.Add(_xmlWriterSnippet.WriteStartElement(elementName));
            }

            statements.AddRange(
                CreateXmlWriteValueStatement(itemVariable, itemType, serializationFormat),
                _xmlWriterSnippet.WriteEndElement());

            return statements;
        }

        private MethodBodyStatement CreateXmlWriteDictionaryStatement(
            XmlPropertyInfo prop,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var keyType = prop.PropertyType.Arguments[0];
            var valueType = prop.PropertyType.Arguments[1];
            var xmlWireInfo = prop.XmlWireInfo;
            var statements = new List<MethodBodyStatement>();

            // If not unwrapped, write the wrapper element
            if (xmlWireInfo.Unwrapped != true)
            {
                if (xmlWireInfo.Namespace != null && namespaces != null && namespaces.TryGetValue(xmlWireInfo.Namespace.Namespace, out var nsInfo))
                {
                    statements.Add(_xmlWriterSnippet.WriteStartElement(
                        nsInfo.Prefix,
                        xmlWireInfo.Name,
                        nsInfo.Namespace));
                }
                else
                {
                    statements.Add(_xmlWriterSnippet.WriteStartElement(xmlWireInfo.Name));
                }
            }

            statements.Add(CreateXmlWriteDictionaryForEachStatement(prop.SerializationExp, keyType, valueType, prop.SerializationFormat));

            // If not unwrapped, write the end element
            if (xmlWireInfo.Unwrapped != true)
            {
                statements.Add(_xmlWriterSnippet.WriteEndElement());
            }

            return WrapInIsDefinedCheck(prop, statements);
        }

        private ForEachStatement CreateXmlWriteDictionaryForEachStatement(
            ValueExpression collection,
            CSharpType keyType,
            CSharpType valueType,
            SerializationFormat serializationFormat)
        {
            return new ForEachStatement("pair", collection.AsDictionary(keyType, valueType), out KeyValuePairExpression kvpExpression)
            {
                CreateXmlWriteDictionaryEntryStatement(kvpExpression, valueType, serializationFormat)
            };
        }

        private MethodBodyStatement CreateXmlWriteDictionaryEntryStatement(
            KeyValuePairExpression kvpExpression,
            CSharpType valueType,
            SerializationFormat serializationFormat)
        {
            var statements = new List<MethodBodyStatement>
            {
                _xmlWriterSnippet.WriteStartElement(kvpExpression.Key),
                CreateXmlWriteValueStatement(kvpExpression.Value, valueType, serializationFormat),
                _xmlWriterSnippet.WriteEndElement()
            };
            return statements;
        }

        private MethodBodyStatement CreateXmlWriteTextContentStatement(XmlPropertyInfo prop)
        {
            var serializedValue = CreateXmlSerializeValueExpression(prop.SerializationExp, prop.PropertyType, prop.SerializationFormat);
            return WrapInIsDefinedCheck(prop, _xmlWriterSnippet.WriteValue(serializedValue));
        }

        private ValueExpression CreateXmlSerializeValueExpression(ValueExpression value, CSharpType valueType, SerializationFormat serializationFormat)
        {
            var underlyingType = valueType.IsNullable && valueType.Arguments.Count > 0
                ? valueType.Arguments[0]
                : valueType;

            if (underlyingType.IsEnum)
            {
                return underlyingType.ToSerial(value.NullableStructValue(valueType));
            }

            if (!underlyingType.IsFrameworkType)
            {
                return value;
            }

            return CreateXmlSerializePrimitiveExpression(value, underlyingType, serializationFormat);
        }

        private static ValueExpression CreateXmlSerializePrimitiveExpression(ValueExpression value, CSharpType valueType, SerializationFormat serializationFormat)
        {
            return valueType.FrameworkType switch
            {
                Type t when t == typeof(DateTimeOffset) => serializationFormat switch
                {
                    _ => value.Invoke(nameof(ToString), Literal(serializationFormat.ToFormatSpecifier()))
                },
                Type t when t == typeof(TimeSpan) => value.Invoke(nameof(ToString), Literal(serializationFormat.ToFormatSpecifier())),
                Type t when t == typeof(byte[]) => serializationFormat switch
                {
                    SerializationFormat.Bytes_Base64Url => Static(typeof(Convert)).Invoke(nameof(Convert.ToBase64String), value),
                    _ => Static(typeof(Convert)).Invoke(nameof(Convert.ToBase64String), value)
                },
                Type t when t == typeof(BinaryData) => serializationFormat switch
                {
                    SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url =>
                        Static(typeof(Convert)).Invoke(nameof(Convert.ToBase64String), value.Invoke("ToArray")),
                    _ => value.Invoke(nameof(ToString))
                },
                _ => value
            };
        }

        private static MethodBodyStatement WrapInIsDefinedCheck(XmlPropertyInfo prop, MethodBodyStatement writeStatements)
        {
            if (!prop.IsReadOnly &&
                (IsNonNullableValueType(prop.PropertyType) || (prop.IsRequired && !prop.PropertyType.IsNullable)))
            {
                return writeStatements;
            }

            var isDefinedCondition = prop.PropertyType is { IsCollection: true, IsReadOnlyMemory: false }
                ? OptionalSnippets.IsCollectionDefined(prop.SerializationExp)
                : OptionalSnippets.IsDefined(prop.SerializationExp);

            return new IfStatement(isDefinedCondition)
            {
                writeStatements
            };
        }

        internal MethodProvider BuildXmlDeserializationMethod()
        {
            var methodName = $"{DeserializationMethodNamePrefix}{_model.Name}";
            var signatureModifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static;
            var parameters = new List<ParameterProvider>
            {
                _xElementDeserializationParam,
                _serializationOptionsParameter,
            };

            var methodBody = _inputModel.DiscriminatedSubtypes.Count > 0
                ? BuildXmlDiscriminatedModelDeserializationMethodBody()
                : BuildXmlDeserializationMethodBody();

            return new MethodProvider(
                new MethodSignature(methodName, null, signatureModifiers, _model.Type, null, parameters),
                methodBody,
                this);
        }

        private MethodBodyStatement[] BuildXmlDiscriminatedModelDeserializationMethodBody()
        {
            var unknownVariant = _model.DerivedModels.First(m => m.IsUnknownDiscriminatorModel);
            bool onlyContainsUnknownDerivedModel = _model.DerivedModels.Count == 1;
            var discriminator = _model.CanonicalView.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
            if (discriminator == null && _model.BaseModelProvider != null)
            {
                // Look for discriminator property in the base model
                discriminator = _model.BaseModelProvider.CanonicalView.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
            }

            var deserializeDiscriminatedModelsConditions = BuildXmlDiscriminatedModelsCondition(
                discriminator,
                GetXmlDiscriminatorSwitchCases(unknownVariant),
                onlyContainsUnknownDerivedModel,
                _xmlElementParameterSnippet);

            return
            [
                new IfStatement(_xmlElementParameterSnippet.Equal(Null)) { Return(Null) },
                MethodBodyStatement.EmptyLine,
                deserializeDiscriminatedModelsConditions,
                Return(GetDeserializationMethodInvocationForType(unknownVariant, _xmlElementParameterSnippet, null, _serializationOptionsParameter))
            ];
        }

        private static MethodBodyStatement BuildXmlDiscriminatedModelsCondition(
            PropertyProvider? discriminatorProperty,
            SwitchCaseStatement[] abstractSwitchCases,
            bool onlyContainsUnknownDerivedModel,
            ScopedApi<XElement> elementParameter)
        {
            var xmlSerializationOptions = (discriminatorProperty?.WireInfo?.SerializationOptions as ScmSerializationOptions)?.Xml;
            if (!onlyContainsUnknownDerivedModel && xmlSerializationOptions?.Name != null)
            {
                var discriminatorElementName = xmlSerializationOptions.Name;
                var discriminatorElement = new VariableExpression(typeof(XElement), "discriminatorElement");

                return new MethodBodyStatements(
                [
                    Declare(discriminatorElement, elementParameter.Element(Literal(discriminatorElementName))),
                    new IfStatement(discriminatorElement.NotEqual(Null))
                    {
                        new SwitchStatement(discriminatorElement.CastTo(typeof(string)), abstractSwitchCases)
                    }
                ]);
            }

            return MethodBodyStatement.Empty;
        }

        private SwitchCaseStatement[] GetXmlDiscriminatorSwitchCases(ModelProvider unknownVariant)
        {
            SwitchCaseStatement[] cases = new SwitchCaseStatement[_model.DerivedModels.Count - 1];
            int index = 0;
            for (int i = 0; i < _model.DerivedModels.Count; i++)
            {
                var model = _model.DerivedModels[i];
                if (ReferenceEquals(model, unknownVariant))
                {
                    continue;
                }
                cases[index++] = new SwitchCaseStatement(
                    Literal(model.DiscriminatorValue!),
                    Return(GetDeserializationMethodInvocationForType(model, _xmlElementParameterSnippet, _dataParameter, _serializationOptionsParameter)));
            }
            return cases;
        }

        private MethodBodyStatement[] BuildXmlDeserializationMethodBody()
        {
            var valueKindEqualsNullReturn = _isStruct
                ? Return(Default)
                : Return(Null);

            var categorizedProperties = AllCategorizedXmlProperties;
            var statements = new List<MethodBodyStatement>
            {
                new IfStatement(_xmlElementParameterSnippet.Equal(Null)) { valueKindEqualsNullReturn },
                MethodBodyStatement.EmptyLine,
                GetXmlNamespaceDeclarations(categorizedProperties.Namespaces),
                GetPropertyVariableDeclarations(),
                MethodBodyStatement.EmptyLine
            };

            if (categorizedProperties.AttributeProperties?.Count > 0)
            {
                statements.Add(CreateXmlDeserializeForEachStatement(
                    _xmlElementParameterSnippet,
                    categorizedProperties.AttributeProperties,
                    categorizedProperties.Namespaces,
                    isAttributes: true));
                statements.Add(MethodBodyStatement.EmptyLine);
            }

            if (categorizedProperties.ElementProperties?.Count > 0)
            {
                statements.Add(CreateXmlDeserializeForEachStatement(
                    _xmlElementParameterSnippet,
                    categorizedProperties.ElementProperties,
                    categorizedProperties.Namespaces,
                    isAttributes: false));
            }

            if (categorizedProperties.TextContentProperty != null)
            {
                statements.Add(categorizedProperties.TextContentProperty.DeserializationExp.Assign(_xmlElementParameterSnippet.Value()).Terminate());
                statements.Add(MethodBodyStatement.EmptyLine);
            }

            statements.Add(Return(New.Instance(_model.Type, GetSerializationCtorParameterValues())));

            return [.. statements];
        }

        private XmlPropertyCategories CategorizeXmlProperties(bool ownPropertiesOnly = false)
        {
            List<XmlPropertyInfo>? attributeProperties = null;
            List<XmlPropertyInfo>? elementProperties = null;
            XmlPropertyInfo? textContentProperty = null;
            Dictionary<string, XmlNamespaceInfo>? namespaces = null;

            var parameters = SerializationConstructor.Signature.Parameters;
            HashSet<PropertyProvider>? ownProperties = null;
            HashSet<FieldProvider>? ownFields = null;

            // Get the custom serialization attributes
            var serializationAttributes = GetSerializationAttributes();

            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property == null && parameter.Field == null)
                {
                    continue;
                }

                if (ownPropertiesOnly)
                {
                    if (parameter.Property != null)
                    {
                        ownProperties ??= [.. _model.CanonicalView.Properties];
                        if (!ownProperties.Contains(parameter.Property))
                        {
                            continue;
                        }
                    }
                    else if (parameter.Field != null)
                    {
                        ownFields ??= [.. _model.CanonicalView.Fields];
                        if (!ownFields.Contains(parameter.Field))
                        {
                            continue;
                        }
                    }
                }

                var wireInfo = parameter.Property?.WireInfo ?? parameter.Field?.WireInfo;
                var xmlWireInfo = (wireInfo?.SerializationOptions as ScmSerializationOptions)?.Xml;
                if (xmlWireInfo == null || wireInfo?.IsHttpMetadata == true)
                {
                    continue;
                }

                var propertyType = parameter.Property?.Type ?? parameter.Field?.Type;
                var propertyExpression = parameter.Property?.AsVariableExpression ?? parameter.Field?.AsVariableExpression;
                var propertyName = parameter.Property?.Name ?? parameter.Field?.Name;
                if (propertyType == null || propertyExpression == null || propertyName == null)
                {
                    continue;
                }

                // Collect unique namespaces
                if (xmlWireInfo.Namespace != null)
                {
                    namespaces ??= [];
                    CollectNamespace(propertyName, xmlWireInfo.Namespace, namespaces);
                }
                if (xmlWireInfo.ItemsNamespace != null)
                {
                    namespaces ??= [];
                    CollectNamespace(propertyName, xmlWireInfo.ItemsNamespace, namespaces);
                }

                var serializationFormat = wireInfo?.SerializationFormat ?? SerializationFormat.Default;
                var isRequired = wireInfo?.IsRequired ?? false;
                var isReadOnly = wireInfo?.IsReadOnly ?? false;
                MemberExpression SerializationExp;
                if (parameter.Property != null)
                {
                    SerializationExp = parameter.Property;
                }
                else if (parameter.Field != null)
                {
                    SerializationExp = parameter.Field;
                }
                else
                {
                    continue;
                }

                var propertyInfo = new XmlPropertyInfo(propertyName, propertyType, SerializationExp, propertyExpression, xmlWireInfo, serializationFormat, serializationAttributes, isRequired, isReadOnly);

                // Categorize by XML serialization type
                if (xmlWireInfo.Attribute == true)
                {
                    (attributeProperties ??= []).Add(propertyInfo);
                    continue;
                }
                if (xmlWireInfo.Unwrapped == true && !propertyType.IsCollection)
                {
                    textContentProperty = propertyInfo;
                    continue;
                }

                (elementProperties ??= []).Add(propertyInfo);
            }

            return new XmlPropertyCategories(attributeProperties, elementProperties, textContentProperty, namespaces);
        }

        private ForEachStatement CreateXmlDeserializeForEachStatement(
            ScopedApi<XElement> elementParameter,
            List<XmlPropertyInfo> properties,
            Dictionary<string, XmlNamespaceInfo>? namespaces,
            bool isAttributes)
        {
            return isAttributes switch
            {
                true => new ForEachStatement("attr", elementParameter.Attributes(), out var attr)
                {
                    CreateXmlDeserializeAttributeStatements(attr.As<XAttribute>(), properties, namespaces)
                },
                false => new ForEachStatement("child", elementParameter.Elements(), out var child)
                {
                    CreateXmlDeserializeElementStatements(child.As<XElement>(), properties, namespaces)
                }
            };
        }

        private MethodBodyStatement CreateXmlDeserializeElementStatements(
            ScopedApi<XElement> childElement,
            List<XmlPropertyInfo> elementProperties,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var statements = new List<MethodBodyStatement>();
            var localNameVariable = new VariableExpression(typeof(string), "localName");
            var nsVariable = new VariableExpression(typeof(XNamespace), "ns");

            statements.Add(Declare(localNameVariable, childElement.GetLocalName()));
            if (namespaces?.Count > 0)
            {
                statements.AddRange(
                    Declare(nsVariable, childElement.Property("Name").Property("Namespace").As<XNamespace>()),
                    MethodBodyStatement.EmptyLine);
            }

            foreach (var prop in elementProperties)
            {
                MethodBodyStatement deserializationStatement = GetXmlDeserializationHookStatement(
                    prop.PropertyName,
                    prop.SerializationAttributes,
                    childElement,
                    prop.DeserializationExp,
                    out bool hasHook);

                if (!hasHook)
                {
                    deserializationStatement = CreateXmlDeserializePropertyAssignment(
                        childElement,
                        prop.PropertyType,
                        prop.DeserializationExp,
                        prop.XmlWireInfo,
                        prop.SerializationFormat,
                        namespaces);
                }

                // Build condition: check localName and optionally namespace
                ScopedApi<bool> condition = localNameVariable.Equal(Literal(prop.XmlWireInfo.Name));
                if (prop.XmlWireInfo.Namespace != null && namespaces != null && namespaces.TryGetValue(prop.XmlWireInfo.Namespace.Namespace, out var nsInfo))
                {
                    condition = condition.And(nsVariable.Equal(nsInfo.VariableExpression));
                }

                var checkIfLocalNameEquals = new IfStatement(condition)
                {
                    deserializationStatement,
                    Continue
                };

                statements.Add(checkIfLocalNameEquals);
            }

            return statements;
        }

        private static MethodBodyStatement GetXmlDeserializationHookStatement(
            string propertyName,
            IEnumerable<AttributeStatement> serializationAttributes,
            ValueExpression xmlValue,
            VariableExpression variableExpression,
            out bool hasHook)
        {
            hasHook = false;
            foreach (var attribute in serializationAttributes)
            {
                if (CodeGenAttributes.TryGetCodeGenSerializationAttributeValue(
                        attribute,
                        out var name,
                        out _,
                        out _,
                        out var deserializationHook,
                        out _) && name == propertyName && deserializationHook != null)
                {
                    hasHook = true;
                    return Static().Invoke(deserializationHook, xmlValue, ByRef(variableExpression)).Terminate();
                }
            }

            return MethodBodyStatement.Empty;
        }

        private MethodBodyStatement? GetXmlSerializationHookStatement(
            string propertyName,
            IEnumerable<AttributeStatement> serializationAttributes)
        {
            foreach (var attribute in serializationAttributes)
            {
                if (CodeGenAttributes.TryGetCodeGenSerializationAttributeValue(
                        attribute,
                        out var name,
                        out _,
                        out var serializationHook,
                        out _,
                        out _) && name == propertyName && serializationHook != null)
                {
                    return This.Invoke(serializationHook, _xmlWriterSnippet, _serializationOptionsParameter).Terminate();
                }
            }

            return null;
        }

        private MethodBodyStatement CreateXmlDeserializePropertyAssignment(
            ScopedApi<XElement> childElement,
            CSharpType propertyType,
            VariableExpression propertyExpression,
            XmlSerialization xmlWireInfo,
            SerializationFormat serializationFormat,
            Dictionary<string, XmlNamespaceInfo>? namespaces = null)
        {
            if (propertyType.IsList || propertyType.IsArray)
            {
                return CreateXmlDeserializeListAssignment(childElement, propertyType, propertyExpression, xmlWireInfo, serializationFormat, namespaces);
            }

            if (propertyType.IsDictionary)
            {
                return CreateXmlDeserializeDictionaryAssignment(childElement, propertyType, propertyExpression, xmlWireInfo, serializationFormat);
            }

            var deserializedValue = CreateXmlDeserializeValueExpression(childElement, propertyType, serializationFormat);
            return propertyExpression.Assign(deserializedValue).Terminate();
        }

        private MethodBodyStatement CreateXmlDeserializeListAssignment(
            ScopedApi<XElement> childElement,
            CSharpType listType,
            VariableExpression listExpression,
            XmlSerialization xmlWireInfo,
            SerializationFormat serializationFormat,
            Dictionary<string, XmlNamespaceInfo>? namespaces = null)
        {
            var elementType = listType.ElementType;
            if (xmlWireInfo.Unwrapped == true)
            {
                return new MethodBodyStatements(
                [
                    new IfStatement(listExpression.Equal(Null))
                    {
                        listExpression.Assign(New.List(elementType)).Terminate(),
                    },
                    DeserializeXmlValue(childElement, elementType, serializationFormat, out var itemValue),
                    listExpression.Invoke("Add", itemValue).Terminate()
                ]);
            }
            else
            {
                var itemsName = xmlWireInfo.ItemsName;
                var arrayDeclaration = Declare("array", New.List(elementType), out var listVariable);

                // Build element name expression - with namespace if available
                ValueExpression elementNameExpression;
                if (xmlWireInfo.ItemsNamespace != null && namespaces != null && namespaces.TryGetValue(xmlWireInfo.ItemsNamespace.Namespace, out var nsInfo))
                {
                    elementNameExpression = new BinaryOperatorExpression("+", nsInfo.VariableExpression, Literal(itemsName)).As<XName>();
                }
                else
                {
                    elementNameExpression = Literal(itemsName);
                }

                var foreachStatement = ForEachStatement.Create("e", childElement.Elements(elementNameExpression), out ScopedApi<XElement> item)
                    .Add(new MethodBodyStatement[]
                    {
                        DeserializeXmlValue(item, elementType, serializationFormat, out var deserializedItem),
                        listVariable.Add(deserializedItem)
                    });

                return new MethodBodyStatements(
                [
                    arrayDeclaration,
                    foreachStatement,
                    listExpression.Assign(listVariable).Terminate()
                ]);
            }
        }

        private MethodBodyStatement CreateXmlDeserializeDictionaryAssignment(
            ScopedApi<XElement> childElement,
            CSharpType dictionaryType,
            VariableExpression dictionaryExpression,
            XmlSerialization xmlWireInfo,
            SerializationFormat serializationFormat)
        {
            var valueType = dictionaryType.ElementType;
            if (xmlWireInfo.Unwrapped == true)
            {
                return new MethodBodyStatements(
                [
                    new IfStatement(dictionaryExpression.Equal(Null))
                    {
                        dictionaryExpression.Assign(New.Dictionary(dictionaryType.Arguments[0], dictionaryType.Arguments[1])).Terminate(),
                    },
                    CreateXmlDeserializeDictionaryValueStatement(valueType, dictionaryExpression, childElement, serializationFormat)
                ]);
            }

            var dictionaryDeclaration = Declare(
                "dictionary",
                New.Dictionary(dictionaryType.Arguments[0], dictionaryType.Arguments[1]),
                out var dictVariable);

            var foreachStatement = ForEachStatement.Create("e", childElement.Elements(), out ScopedApi<XElement> item)
                .Add(new MethodBodyStatement[]
                {
                    CreateXmlDeserializeDictionaryValueStatement(valueType, dictVariable, item, serializationFormat)
                });

            return new MethodBodyStatements(
            [
                dictionaryDeclaration,
                foreachStatement,
                dictionaryExpression.Assign(dictVariable).Terminate()
            ]);
        }

        private MethodBodyStatement CreateXmlDeserializeDictionaryValueStatement(
            CSharpType valueType,
            ValueExpression dictionary,
            ScopedApi<XElement> element,
            SerializationFormat serializationFormat)
        {
            return new MethodBodyStatement[]
            {
                DeserializeXmlValue(element, valueType, serializationFormat, out var value),
                dictionary.Invoke("Add", element.GetLocalName(), value).Terminate()
            };
        }

        private MethodBodyStatement DeserializeXmlValue(
            ScopedApi<XElement> element,
            CSharpType valueType,
            SerializationFormat serializationFormat,
            out ValueExpression value)
        {
            if (valueType.IsList || valueType.IsArray)
            {
                var listDeclaration = Declare("list", New.List(valueType.ElementType), out var listVariable);
                var foreachStatement = ForEachStatement.Create("item", element.Elements(), out ScopedApi<XElement> item)
                    .Add(new MethodBodyStatement[]
                    {
                        DeserializeXmlValue(item, valueType.ElementType, serializationFormat, out var deserializedItem),
                        listVariable.Add(deserializedItem)
                    });

                value = listVariable;
                return new MethodBodyStatement[] { listDeclaration, foreachStatement };
            }

            if (valueType.IsDictionary)
            {
                var dictDeclaration = Declare("dict", New.Dictionary(valueType.Arguments[0], valueType.Arguments[1]), out var dictVariable);
                var foreachStatement = ForEachStatement.Create("item", element.Elements(), out ScopedApi<XElement> item)
                    .Add(CreateXmlDeserializeDictionaryValueStatement(valueType.ElementType, dictVariable, item, serializationFormat));

                value = dictVariable;
                return new MethodBodyStatement[] { dictDeclaration, foreachStatement };
            }

            value = CreateXmlDeserializeValueExpression(element, valueType, serializationFormat);
            return MethodBodyStatement.Empty;
        }

        private ValueExpression CreateXmlDeserializeValueExpression(ScopedApi<XElement> element, CSharpType valueType, SerializationFormat serializationFormat)
        {
            var underlyingType = valueType.IsNullable && valueType.Arguments.Count > 0
                ? valueType.Arguments[0]
                : valueType;

            if (underlyingType.IsEnum && underlyingType.UnderlyingEnumType != null)
            {
                var underlyingExpression = CreateXmlDeserializePrimitiveExpression(element, underlyingType.UnderlyingEnumType, serializationFormat);
                return underlyingType.ToEnum(underlyingExpression);
            }

            if (!underlyingType.IsFrameworkType)
            {
                return GetDeserializationMethodInvocationForType(underlyingType, element, null, _serializationOptionsParameter);
            }

            return CreateXmlDeserializePrimitiveExpression(element, valueType, serializationFormat);
        }

        private static ValueExpression CreateXmlDeserializePrimitiveExpression(
            ScopedApi<XElement> element,
            CSharpType valueType,
            SerializationFormat serializationFormat)
        {
            return valueType.FrameworkType switch
            {
                Type t when t == typeof(Uri) => New.Instance(valueType.FrameworkType, element.Value()),
                Type t when t == typeof(IPAddress) => Static<IPAddress>().Invoke(nameof(IPAddress.Parse), element.Value()),
                Type t when t == typeof(Stream) => BinaryDataSnippets.FromString(element.Value()).ToStream(),
                Type t when t == typeof(byte[]) => element.GetBytesFromBase64(serializationFormat.ToFormatSpecifier()),
                Type t when t == typeof(BinaryData) => serializationFormat is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                    ? BinaryDataSnippets.FromBytes(element.GetBytesFromBase64(serializationFormat.ToFormatSpecifier()))
                    : BinaryDataSnippets.FromString(element.Value()),
                Type t when t == typeof(DateTimeOffset) => element.GetDateTimeOffset(serializationFormat.ToFormatSpecifier()),
                Type t when t == typeof(TimeSpan) => element.GetTimeSpan(serializationFormat.ToFormatSpecifier()),
                Type t when t == typeof(byte) => element.CastTo(typeof(int)).CastTo(typeof(byte)),
                Type t when t == typeof(sbyte) => element.CastTo(typeof(int)).CastTo(typeof(sbyte)),
                Type t when t == typeof(short) => element.CastTo(typeof(int)).CastTo(typeof(short)),
                Type t when t == typeof(ushort) => element.CastTo(typeof(int)).CastTo(typeof(ushort)),
                _ => element.CastTo(valueType)
            };
        }

        private MethodBodyStatement CreateXmlDeserializeAttributeStatements(
            ScopedApi<XAttribute> attrVariable,
            List<XmlPropertyInfo> attributeProperties,
            Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            var hasNamespacedAttributes = attributeProperties.Any(p => p.XmlWireInfo.Namespace != null);
            var statements = new List<MethodBodyStatement>
            {
                Declare("localName", typeof(string), attrVariable.GetLocalName(), out var localNameVar)
            };

            VariableExpression? nsVar = null;
            if (hasNamespacedAttributes)
            {
                statements.AddRange(
                    Declare("ns", typeof(XNamespace), attrVariable.Name().Namespace(), out nsVar),
                    MethodBodyStatement.EmptyLine);
            }

            foreach (var prop in attributeProperties)
            {
                MethodBodyStatement deserializationStatement = GetXmlDeserializationHookStatement(
                    prop.PropertyName,
                    prop.SerializationAttributes,
                    attrVariable,
                    prop.DeserializationExp,
                    out bool hasHook);

                if (!hasHook)
                {
                    var deserializedValue = attrVariable.CastTo(prop.PropertyType);
                    deserializationStatement = prop.DeserializationExp.Assign(deserializedValue).Terminate();
                }

                ScopedApi<bool> condition = localNameVar.Equal(Literal(prop.XmlWireInfo.Name));
                if (prop.XmlWireInfo.Namespace != null && namespaces != null && nsVar != null)
                {
                    var nsInfo = namespaces[prop.XmlWireInfo.Namespace.Namespace];
                    condition = condition.And(nsVar.Equal(nsInfo.VariableExpression));
                }

                var checkIfLocalNameEquals = new IfStatement(condition)
                {
                    deserializationStatement,
                    Continue
                };

                statements.Add(checkIfLocalNameEquals);
            }

            return statements;
        }

        private SwitchCaseStatement CreatePersistableModelWriteCoreXmlSwitchCase()
        {
            var xmlElementName = _inputModel.SerializationOptions.Xml?.Name ?? _model.Name;

            return new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippets.XmlFormat,
                new UsingScopeStatement(typeof(MemoryStream), "stream", New.Instance(typeof(MemoryStream), Int(256)), out var streamVar)
                {
                    new UsingScopeStatement(
                        typeof(XmlWriter),
                        "writer",
                        XmlWriterSnippets.Create(streamVar, ModelSerializationExtensionsSnippets.XmlWriterSettings),
                        out var xmlWriterVar)
                    {
                        This.Invoke(XmlWriteMethodName, [xmlWriterVar, _serializationOptionsParameter, Literal(xmlElementName)]).Terminate()
                    },
                    new IfElseStatement(
                        streamVar.As<Stream>().Position().GreaterThan(IntSnippets.MaxValue),
                        Return(BinaryDataSnippets.FromStream(streamVar, false)),
                        Return(New.Instance(
                            typeof(BinaryData),
                            streamVar.As<Stream>().GetBuffer()
                                .Invoke(nameof(MemoryExtensions.AsMemory), [Int(0), streamVar.As<Stream>().Position().CastTo(typeof(int))]))))
                });
        }

        private SwitchCaseStatement CreatePersistableModelCreateCoreXmlSwitchCase(CSharpType typeForDeserialize)
        {
            return new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippets.XmlFormat,
                new MethodBodyStatement[]
                {
                    new UsingScopeStatement(typeof(Stream), "dataStream", _dataParameter.As<BinaryData>().ToStream(), out var streamVar)
                    {
                        Return(GetDeserializationMethodInvocationForType(
                            typeForDeserialize,
                            XElementSnippets.Load(streamVar.As<Stream>(), XmlLinqSnippets.PreserveWhitespace),
                            _dataParameter,
                            _serializationOptionsParameter))
                    },
                });
        }

        private MethodProvider BuildXmlExplicitFromClientResult()
        {
            var result = new ParameterProvider(
                ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ResponseParameterName,
                $"The {ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType:C} to deserialize the {Type:C} from.",
                ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                            MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;

            var response = result.ToApi<ClientResponseApi>();
            MethodBodyStatement responseDeclaration;

            if (response.Original == response.GetRawResponse().Original)
            {
                responseDeclaration = MethodBodyStatement.Empty;
            }
            else
            {
                responseDeclaration = UsingDeclare("response", ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.HttpResponseType, result.ToApi<ClientResponseApi>().GetRawResponse(), out var responseVar);
                response = responseVar.ToApi<ClientResponseApi>();
            }

            MethodBodyStatement[] methodBody =
            [
                responseDeclaration,
                UsingDeclare("stream", typeof(Stream), response.Property(nameof(HttpResponseApi.ContentStream)), out var streamVar),
                new IfStatement(streamVar.Equal(Null)) { Return(Default) },
                MethodBodyStatement.EmptyLine,
                Return(GetDeserializationMethodInvocationForType(
                    _model,
                    XElementSnippets.Load(streamVar.As<Stream>(), XmlLinqSnippets.PreserveWhitespace)))
            ];

            return new MethodProvider(
               new MethodSignature(Type.Name, null, modifiers, Type, null, [result]),
               methodBody,
               this);
        }

        private MethodProvider BuildJsonAndXmlExplicitFromClientResult()
        {
            var result = new ParameterProvider(
                ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ResponseParameterName,
                $"The {ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType:C} to deserialize the {Type:C} from.",
                ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                            MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;

            var response = result.ToApi<ClientResponseApi>();
            MethodBodyStatement responseDeclaration;
            ScopedApi<bool> tryGetContentType;
            ScopedApi<string>? contentTypeVar;

            if (response.Original == response.GetRawResponse().Original)
            {
                responseDeclaration = MethodBodyStatement.Empty;
                tryGetContentType = result.ToApi<HttpResponseApi>().TryGetHeader(ContentTypeHeader, out contentTypeVar);
            }
            else
            {
                responseDeclaration = UsingDeclare("response", ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.HttpResponseType, response.GetRawResponse(), out var responseVar);
                response = responseVar.ToApi<ClientResponseApi>();
                tryGetContentType = responseVar.ToApi<HttpResponseApi>().TryGetHeader(ContentTypeHeader, out contentTypeVar);
            }

            var startsWithJson = contentTypeVar!.StartsWith(Literal("application/json"), StringComparison.OrdinalIgnoreCase);
            var isJsonCondition = tryGetContentType.And(startsWithJson);
            var jsonDeserializationBlock = new MethodBodyStatement[]
            {
                UsingDeclare("document", typeof(JsonDocument), response.Property(nameof(HttpResponseApi.Content)).As<BinaryData>().Parse(ModelSerializationExtensionsSnippets.JsonDocumentOptions), out var docVariable),
                Return(GetDeserializationMethodInvocationForType(_model, docVariable.As<JsonDocument>().RootElement()))
            };

            var xmlDeserialization = new MethodBodyStatement[]
            {
                UsingDeclare("stream", typeof(Stream), response.Property(nameof(HttpResponseApi.ContentStream)), out var streamVar),
                new IfStatement(streamVar.Equal(Null)) { Return(Default) },
                MethodBodyStatement.EmptyLine,
                Return(GetDeserializationMethodInvocationForType(_model, XElementSnippets.Load(streamVar.As<Stream>(), XmlLinqSnippets.PreserveWhitespace)))
            };

            MethodBodyStatement[] methodBody =
            [
                responseDeclaration,
                MethodBodyStatement.EmptyLine,
                new IfStatement(isJsonCondition) { jsonDeserializationBlock },
                MethodBodyStatement.EmptyLine,
                xmlDeserialization
            ];

            return new MethodProvider(
                new MethodSignature(Type.Name, null, modifiers, Type, null, [result]),
                methodBody,
                this);
        }

        private static void CollectNamespace(string propertyName, XmlSerializationNamespace nsOptions, Dictionary<string, XmlNamespaceInfo> namespaces)
        {
            if (!namespaces.ContainsKey(nsOptions.Namespace))
            {
                var variableName = $"{propertyName}Ns".ToVariableName();
                var variableExpression = new VariableExpression(typeof(XNamespace), variableName);
                namespaces[nsOptions.Namespace] = new XmlNamespaceInfo(nsOptions.Namespace, variableName, nsOptions.Prefix, variableExpression);
            }
        }

        private static MethodBodyStatement GetXmlNamespaceDeclarations(Dictionary<string, XmlNamespaceInfo>? namespaces)
        {
            if (namespaces == null || namespaces.Count == 0)
            {
                return MethodBodyStatement.Empty;
            }

            var statements = new List<MethodBodyStatement>();
            foreach (var ns in namespaces.Values)
            {
                statements.Add(Declare(ns.VariableExpression, Literal(ns.Namespace)));
            }

            statements.Add(MethodBodyStatement.EmptyLine);
            return statements;
        }
    }
}
