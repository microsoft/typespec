// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
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
        private readonly ParameterProvider _xElementDeserializationParam = new("element", $"The xml element to deserialize.", typeof(XElement));
        private readonly ScopedApi<XElement> _xmlElementParameterSnippet;

        /// <summary>
        /// Represents a property that can be deserialized from XML, categorized by its serialization type.
        /// </summary>
        private record XmlPropertyInfo(
            string PropertyName,
            CSharpType PropertyType,
            VariableExpression PropertyExpression,
            XmlWireInformation XmlWireInfo,
            SerializationFormat SerializationFormat,
            IEnumerable<AttributeStatement> SerializationAttributes);

        /// <summary>
        /// Categorized XML properties for deserialization.
        /// </summary>
        private record XmlPropertyCategories(
            List<XmlPropertyInfo>? AttributeProperties,
            List<XmlPropertyInfo>? ElementProperties,
            XmlPropertyInfo? TextContentProperty);

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
            if (!onlyContainsUnknownDerivedModel && discriminatorProperty?.WireInfo?.XmlWireInformation?.Name != null)
            {
                var discriminatorElementName = discriminatorProperty.WireInfo.XmlWireInformation.Name;
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

            var categorizedProperties = CategorizeXmlProperties();
            var statements = new List<MethodBodyStatement>
            {
                new IfStatement(_xmlElementParameterSnippet.Equal(Null)) { valueKindEqualsNullReturn },
                MethodBodyStatement.EmptyLine,
                GetPropertyVariableDeclarations(),
                MethodBodyStatement.EmptyLine
            };

            if (categorizedProperties.AttributeProperties?.Count > 0)
            {
                statements.Add(CreateXmlDeserializeForEachStatement(
                    _xmlElementParameterSnippet,
                    categorizedProperties.AttributeProperties,
                    isAttributes: true));
                statements.Add(MethodBodyStatement.EmptyLine);
            }

            if (categorizedProperties.ElementProperties?.Count > 0)
            {
                statements.Add(CreateXmlDeserializeForEachStatement(
                    _xmlElementParameterSnippet,
                    categorizedProperties.ElementProperties,
                    isAttributes: false));
            }

            if (categorizedProperties.TextContentProperty != null)
            {
                statements.Add(categorizedProperties.TextContentProperty.PropertyExpression.Assign(_xmlElementParameterSnippet.Value()).Terminate());
                statements.Add(MethodBodyStatement.EmptyLine);
            }

            statements.Add(Return(New.Instance(_model.Type, GetSerializationCtorParameterValues())));

            return [.. statements];
        }

        private XmlPropertyCategories CategorizeXmlProperties()
        {
            List<XmlPropertyInfo>? attributeProperties = null;
            List<XmlPropertyInfo>? elementProperties = null;
            XmlPropertyInfo? textContentProperty = null;

            var parameters = SerializationConstructor.Signature.Parameters;

            // Get the custom serialization attributes
            var serializationAttributes = GetSerializationAttributes();

            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property == null && parameter.Field == null)
                {
                    continue;
                }

                var wireInfo = parameter.Property?.WireInfo ?? parameter.Field?.WireInfo;
                var xmlWireInfo = wireInfo?.XmlWireInformation;
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

                var serializationFormat = wireInfo?.SerializationFormat ?? SerializationFormat.Default;
                var propertyInfo = new XmlPropertyInfo(propertyName, propertyType, propertyExpression, xmlWireInfo, serializationFormat, serializationAttributes);

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

            return new XmlPropertyCategories(attributeProperties, elementProperties, textContentProperty);
        }

        private ForEachStatement CreateXmlDeserializeForEachStatement(
            ScopedApi<XElement> elementParameter,
            List<XmlPropertyInfo> properties,
            bool isAttributes)
        {
            return isAttributes switch
            {
                true => new ForEachStatement("attr", elementParameter.Attributes(), out var attr)
                {
                    CreateXmlDeserializeAttributeStatements(attr.As<XAttribute>(), properties)
                },
                false => new ForEachStatement("child", elementParameter.Elements(), out var child)
                {
                    CreateXmlDeserializeElementStatements(child.As<XElement>(), properties)
                }
            };
        }

        private MethodBodyStatement CreateXmlDeserializeElementStatements(
            ScopedApi<XElement> childElement,
            List<XmlPropertyInfo> elementProperties)
        {
            var statements = new List<MethodBodyStatement>();
            var localNameVariable = new VariableExpression(typeof(string), "localName");

            statements.Add(Declare(localNameVariable, childElement.GetLocalName()));

            foreach (var prop in elementProperties)
            {
                MethodBodyStatement deserializationStatement = GetXmlDeserializationHookStatement(
                    prop.PropertyName,
                    prop.SerializationAttributes,
                    childElement,
                    prop.PropertyExpression,
                    out bool hasHook);

                if (!hasHook)
                {
                    deserializationStatement = CreateXmlDeserializePropertyAssignment(
                        childElement,
                        prop.PropertyType,
                        prop.PropertyExpression,
                        prop.XmlWireInfo,
                        prop.SerializationFormat);
                }

                var checkIfLocalNameEquals = new IfStatement(localNameVariable.Equal(Literal(prop.XmlWireInfo.Name)))
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

        private MethodBodyStatement CreateXmlDeserializePropertyAssignment(
            ScopedApi<XElement> childElement,
            CSharpType propertyType,
            VariableExpression propertyExpression,
            XmlWireInformation xmlWireInfo,
            SerializationFormat serializationFormat)
        {
            if (propertyType.IsList || propertyType.IsArray)
            {
                return CreateXmlDeserializeListAssignment(childElement, propertyType, propertyExpression, xmlWireInfo, serializationFormat);
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
            XmlWireInformation xmlWireInfo,
            SerializationFormat serializationFormat)
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
                var foreachStatement = ForEachStatement.Create("e", childElement.Elements(Literal(itemsName)), out ScopedApi<XElement> item)
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
            XmlWireInformation xmlWireInfo,
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
            List<XmlPropertyInfo> attributeProperties)
        {
            var statements = new List<MethodBodyStatement>
            {
                Declare("localName", typeof(string), attrVariable.GetLocalName(), out var localNameVar)
            };

            foreach (var prop in attributeProperties)
            {
                MethodBodyStatement deserializationStatement = GetXmlDeserializationHookStatement(
                    prop.PropertyName,
                    prop.SerializationAttributes,
                    attrVariable,
                    prop.PropertyExpression,
                    out bool hasHook);

                if (!hasHook)
                {
                    var deserializedValue = attrVariable.CastTo(prop.PropertyType);
                    deserializationStatement = prop.PropertyExpression.Assign(deserializedValue).Terminate();
                }

                var checkIfLocalNameEquals = new IfStatement(localNameVar.Equal(Literal(prop.XmlWireInfo.Name)))
                {
                    deserializationStatement,
                    Continue
                };

                statements.Add(checkIfLocalNameEquals);
            }

            return statements;
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
    }
}
