// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal class MrwSerializationTypeDefinition : TypeProvider
    {
        private const string JsonModelWriteCoreMethodName = "JsonModelWriteCore";
        private const string JsonModelCreateCoreMethodName = "JsonModelCreateCore";
        private const string PersistableModelWriteCoreMethodName = "PersistableModelWriteCore";
        private const string PersistableModelCreateCoreMethodName = "PersistableModelCreateCore";
        private const string WriteAction = "writing";
        private const string ReadAction = "reading";
        private readonly ParameterProvider _utf8JsonWriterParameter = new("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
        private readonly ParameterProvider _utf8JsonReaderParameter = new("reader", $"The JSON reader.", typeof(Utf8JsonReader), isRef: true);
        private readonly ParameterProvider _serializationOptionsParameter =
            new("options", $"The client options for reading and writing models.", typeof(ModelReaderWriterOptions));
        private readonly ParameterProvider _jsonElementDeserializationParam =
            new("element", $"The JSON element to deserialize", typeof(JsonElement));
        private readonly ParameterProvider _dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
        private readonly ScopedApi<Utf8JsonWriter> _utf8JsonWriterSnippet;
        private readonly ScopedApi<ModelReaderWriterOptions> _mrwOptionsParameterSnippet;
        private readonly ScopedApi<JsonElement> _jsonElementParameterSnippet;
        private readonly ScopedApi<bool> _isNotEqualToWireConditionSnippet;
        private readonly CSharpType _jsonModelTInterface;
        private readonly CSharpType? _jsonModelObjectInterface;
        private readonly CSharpType _persistableModelTInterface;
        private readonly CSharpType? _persistableModelObjectInterface;
        private readonly ModelProvider _model;
        private readonly InputModelType _inputModel;
        private readonly FieldProvider? _rawDataField;
        private readonly PropertyProvider? _additionalBinaryDataProperty;
        private readonly bool _isStruct;
        private ConstructorProvider? _serializationConstructor;
        // Flag to determine if the model should override the serialization methods
        private readonly bool _shouldOverrideMethods;
        private readonly Lazy<PropertyProvider[]> _additionalProperties;

        public MrwSerializationTypeDefinition(InputModelType inputModel, ModelProvider modelProvider)
        {
            _model = modelProvider;
            _inputModel = inputModel;
            _isStruct = _model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            // Initialize the serialization interfaces
            var interfaceType = inputModel.IsUnknownDiscriminatorModel ? ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel.BaseModel!)! : _model;
            _jsonModelTInterface = new CSharpType(typeof(IJsonModel<>), interfaceType.Type);
            _jsonModelObjectInterface = _isStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _persistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), interfaceType.Type);
            _persistableModelObjectInterface = _isStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            _rawDataField = _model.Fields.FirstOrDefault(f => f.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);
            _additionalBinaryDataProperty = GetAdditionalBinaryDataPropertiesProp();
            _additionalProperties = new([.. _model.Properties.Where(p => p.IsAdditionalProperties)]);
            _shouldOverrideMethods = _model.Type.BaseType != null && _model.Type.BaseType is { IsFrameworkType: false };
            _utf8JsonWriterSnippet = _utf8JsonWriterParameter.As<Utf8JsonWriter>();
            _mrwOptionsParameterSnippet = _serializationOptionsParameter.As<ModelReaderWriterOptions>();
            _jsonElementParameterSnippet = _jsonElementDeserializationParam.As<JsonElement>();
            _isNotEqualToWireConditionSnippet = _mrwOptionsParameterSnippet.Format().NotEqual(ModelReaderWriterOptionsSnippets.WireFormat);
        }

        protected override string GetNamespace() => _model.Type.Namespace;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _model.DeclarationModifiers;
        private ConstructorProvider SerializationConstructor => _serializationConstructor ??= _model.FullConstructor;
        private PropertyProvider[] AdditionalProperties => _additionalProperties.Value;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");

        protected override string BuildName() => _model.Name;

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            if (_model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
            {
                var unknownVariant = _model.DerivedModels.First(m => m.IsUnknownDiscriminatorModel);
                return [new AttributeStatement(typeof(PersistableModelProxyAttribute), TypeOf(unknownVariant.Type))];
            }
            return [];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            List<ConstructorProvider> constructors = new();
            bool ctorWithNoParamsExist = false;

            foreach (var ctor in _model.Constructors)
            {
                var initializationCtorParams = ctor.Signature.Parameters;

                // Check if the model constructor has no parameters
                if (!ctorWithNoParamsExist && !initializationCtorParams.Any())
                {
                    ctorWithNoParamsExist = true;
                }
            }

            // Add an empty constructor if the model doesn't have one
            if (!ctorWithNoParamsExist)
            {
                constructors.Add(BuildEmptyConstructor());
            }

            return [.. constructors];
        }

        /// <summary>
        /// Builds the serialization methods for the model.
        /// </summary>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        protected override MethodProvider[] BuildMethods()
        {
            var jsonModelWriteCoreMethod = BuildJsonModelWriteCoreMethod();
            var methods = new List<MethodProvider>()
            {
                // Add JsonModel serialization methods
                BuildJsonModelWriteMethod(jsonModelWriteCoreMethod),
                jsonModelWriteCoreMethod,
                // Add JsonModel deserialization methods
                BuildJsonModelCreateMethod(),
                BuildJsonModelCreateCoreMethod(),
                BuildDeserializationMethod(),
                // Add PersistableModel serialization methods
                BuildPersistableModelWriteMethod(),
                BuildPersistableModelWriteCoreMethod(),
                BuildPersistableModelCreateMethod(),
                BuildPersistableModelCreateCoreMethod(),
                BuildPersistableModelGetFormatFromOptionsMethod(),
            };

            if (!_inputModel.IsUnknownDiscriminatorModel)
            {
                //cast operators
                methods.Add(BuildImplicitToBinaryContent());
                methods.Add(BuildExplicitFromClientResult());
            }

            if (_isStruct)
            {
                methods.Add(BuildJsonModelWriteMethodObjectDeclaration());
                methods.Add(BuildJsonModelCreateMethodObjectDeclaration());
                methods.Add(BuildPersistableModelWriteMethodObjectDeclaration());
                methods.Add(BuildPersistableModelGetFormatFromOptionsObjectDeclaration());
                methods.Add(BuildPersistableModelCreateMethodObjectDeclaration());
            }

            return [.. methods];
        }

        private MethodProvider BuildExplicitFromClientResult()
        {
            var result = new ParameterProvider("result", $"The {typeof(ClientResult):C} to deserialize the {Type:C} from.", typeof(ClientResult));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;
            // using PipelineResponse response = result.GetRawResponse();
            var responseDeclaration = UsingDeclare("response", typeof(PipelineResponse), result.Invoke(nameof(ClientResult.GetRawResponse)), out var response);
            // using JsonDocument document = JsonDocument.Parse(response.Content);
            var document = UsingDeclare(
                "document",
                typeof(JsonDocument),
                JsonDocumentSnippets.Parse(response.Property(nameof(PipelineResponse.Content)).As<BinaryData>()),
                out var docVariable);
            // return DeserializeT(doc.RootElement, ModelSerializationExtensions.WireOptions);
            var deserialize = Return(_model.Type.Deserialize(docVariable.As<JsonDocument>().RootElement(), ModelSerializationExtensionsSnippets.Wire));
            var methodBody = new MethodBodyStatement[]
            {
                responseDeclaration,
                document,
                deserialize
            };
            return new MethodProvider(
                new MethodSignature(Type.Name, null, modifiers, null, null, [result]),
                methodBody,
                this);
        }

        private MethodProvider BuildImplicitToBinaryContent()
        {
            var model = new ParameterProvider(Type.Name.ToVariableName(), $"The {Type:C} to serialize into {typeof(BinaryContent):C}", Type);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;
            // return BinaryContent.Create(model, ModelSerializationExtensions.WireOptions);
            var binaryContentMethod = Static(typeof(BinaryContent)).Invoke(nameof(BinaryContent.Create), [model, ModelSerializationExtensionsSnippets.Wire]);
            return new MethodProvider(
                new MethodSignature(nameof(BinaryContent), null, modifiers, null, null, [model]),
                Return(binaryContentMethod),
                this);
        }

        /// <summary>
        /// Builds the types that the model type serialization implements.
        /// </summary>
        /// <returns>An array of <see cref="CSharpType"/> types that the model implements.</returns>
        protected override CSharpType[] BuildImplements()
        {
            int interfaceCount = _jsonModelObjectInterface != null ? 2 : 1;
            CSharpType[] interfaces = new CSharpType[interfaceCount];
            interfaces[0] = _jsonModelTInterface;

            if (_jsonModelObjectInterface != null)
            {
                interfaces[1] = _jsonModelObjectInterface;
            }

            return interfaces;
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> write method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelWriteMethod(MethodProvider jsonModelWriteCoreMethod)
        {
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, MethodSignatureModifiers.None, null, null, [_utf8JsonWriterParameter, _serializationOptionsParameter], ExplicitInterface: _jsonModelTInterface),
              BuildJsonModelWriteMethodBody(jsonModelWriteCoreMethod),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> write method for the model object.
        /// </summary>
        internal MethodProvider BuildJsonModelWriteMethodObjectDeclaration()
        {
            // void IJsonModel<object>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => ((IJsonModel<T>)this).Write(writer, options);
            var castToT = This.CastTo(_jsonModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, MethodSignatureModifiers.None, null, null, [_utf8JsonWriterParameter, _serializationOptionsParameter], ExplicitInterface: _jsonModelObjectInterface),
              castToT.Invoke(nameof(IJsonModel<object>.Write), [_utf8JsonWriterParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> create method for the model object.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateMethodObjectDeclaration()
        {
            // object IJsonModel<object>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => ((IJsonModel<T>)this).Create(ref reader, options);
            var castToT = This.CastTo(_jsonModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, MethodSignatureModifiers.None, typeof(object), null, [_utf8JsonReaderParameter, _serializationOptionsParameter], ExplicitInterface: _jsonModelObjectInterface),
              castToT.Invoke(nameof(IJsonModel<object>.Create), [_utf8JsonReaderParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> write method for the model object.
        /// </summary>
        internal MethodProvider BuildPersistableModelWriteMethodObjectDeclaration()
        {
            // BinaryData IPersistableModel<object>.Write(ModelReaderWriterOptions options) => ((IPersistableModel<T>)this).Write(options);
            var castToT = This.CastTo(_persistableModelTInterface);
            var returnType = typeof(BinaryData);
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.Write), null, MethodSignatureModifiers.None, returnType, null, [_serializationOptionsParameter], ExplicitInterface: _persistableModelObjectInterface),
              castToT.Invoke(nameof(IPersistableModel<object>.Write), [_serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> create method for the model object.
        /// </summary>
        internal MethodProvider BuildPersistableModelCreateMethodObjectDeclaration()
        {
            // object IPersistableModel<object>.Create(BinaryData data, ModelReaderWriterOptions options) => ((IPersistableModel<T>)this).Create(data, options);
            var castToT = This.CastTo(_persistableModelTInterface);
            var returnType = typeof(object);
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, MethodSignatureModifiers.None, returnType, null, [_dataParameter, _serializationOptionsParameter], ExplicitInterface: _persistableModelObjectInterface),
              castToT.Invoke(nameof(IPersistableModel<object>.Create), [_dataParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> write core method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelWriteCoreMethod()
        {
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }
            // void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(JsonModelWriteCoreMethodName, null, modifiers, null, null, [_utf8JsonWriterParameter, _serializationOptionsParameter]),
              BuildJsonModelWriteCoreMethodBody(),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> write core method for the model.
        /// </summary>
        internal MethodProvider BuildPersistableModelWriteCoreMethod()
        {
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            var returnType = typeof(BinaryData);
            // BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(PersistableModelWriteCoreMethodName, null, modifiers, returnType, null, [_serializationOptionsParameter]),
              BuildPersistableModelWriteCoreMethodBody(),
              this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> create core method for the model.
        /// </summary>
        internal MethodProvider BuildPersistableModelCreateCoreMethod()
        {
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            // T PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            return new MethodProvider
            (
                new MethodSignature(PersistableModelCreateCoreMethodName, null, modifiers, _model.Type.RootType, null, [_dataParameter, _serializationOptionsParameter]),
                BuildPersistableModelCreateCoreMethodBody(),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> create method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateMethod()
        {
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);
            return new MethodProvider
            (
                new MethodSignature(nameof(IJsonModel<object>.Create), null, MethodSignatureModifiers.None, _jsonModelTInterface.Arguments[0], null, [_utf8JsonReaderParameter, _serializationOptionsParameter], ExplicitInterface: _jsonModelTInterface),
                This.Invoke(JsonModelCreateCoreMethodName, [_utf8JsonReaderParameter, _serializationOptionsParameter]).CastTo(_model.Type),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> create core method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateCoreMethod()
        {
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            var typeForDeserialize = _model.IsUnknownDiscriminatorModel ? _model.Type.BaseType! : _model.Type;

            var methodBody = new MethodBodyStatement[]
            {
                CreateValidateJsonFormat( _persistableModelTInterface, ReadAction),
                // using var document = JsonDocument.ParseValue(ref reader);
                UsingDeclare("document", typeof(JsonDocument), JsonDocumentSnippets.ParseValue(_utf8JsonReaderParameter), out var docVariable),
                // return DeserializeT(doc.RootElement, options);
                Return(typeForDeserialize.Deserialize(JsonDocumentSnippets.RootElement(docVariable.As<JsonDocument>()), _mrwOptionsParameterSnippet))
            };

            // T JsonModelCreateCore(ref reader, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(JsonModelCreateCoreMethodName, null, modifiers, _model.Type.RootType, null, [_utf8JsonReaderParameter, _serializationOptionsParameter]),
              methodBody,
              this
            );
        }

        /// <summary>
        /// Builds the deserialization method for the model.
        /// </summary>
        internal MethodProvider BuildDeserializationMethod()
        {
            var methodName = $"Deserialize{_model.Name}";
            var signatureModifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static;

            // internal static T DeserializeT(JsonElement element, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(methodName, null, signatureModifiers, _model.Type, null, [_jsonElementDeserializationParam, _serializationOptionsParameter]),
              _model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract) ? BuildAbstractDeserializationMethodBody() : BuildDeserializationMethodBody(),
              this
            );
        }

        private MethodBodyStatement[] BuildAbstractDeserializationMethodBody()
        {
            var unknownVariant = _model.DerivedModels.First(m => m.IsUnknownDiscriminatorModel);
            return
            [
                new IfStatement(_jsonElementParameterSnippet.ValueKindEqualsNull()) { Return(Null) },
                new IfStatement(_jsonElementParameterSnippet.TryGetProperty("kind", out var discriminator))
                {
                    new SwitchStatement(discriminator.GetString(), GetAbstractSwitchCases(unknownVariant))
                },
                Return(unknownVariant.Type.Deserialize(_jsonElementParameterSnippet, _serializationOptionsParameter))
            ];
        }

        private SwitchCaseStatement[] GetAbstractSwitchCases(ModelProvider unknownVariant)
        {
            SwitchCaseStatement[] cases = new SwitchCaseStatement[_model.DerivedModels.Count - 1];
            int index = 0;
            for (int i = 0; i < cases.Length; i++)
            {
                var model = _model.DerivedModels[i];
                if (ReferenceEquals(model, unknownVariant))
                    continue;
                cases[index++] = new SwitchCaseStatement(
                    Literal(model.DiscriminatorValue!),
                    Return(model.Type.Deserialize(_jsonElementParameterSnippet, _serializationOptionsParameter)));
            }
            return cases;
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> write method.
        /// </summary>
        internal MethodProvider BuildPersistableModelWriteMethod()
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
            var returnType = typeof(BinaryData);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, MethodSignatureModifiers.None, returnType, null, [_serializationOptionsParameter], ExplicitInterface: _persistableModelTInterface),
                This.Invoke(PersistableModelWriteCoreMethodName, _serializationOptionsParameter),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> create method.
        /// </summary>
        internal MethodProvider BuildPersistableModelCreateMethod()
        {
            ParameterProvider dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Create), null, MethodSignatureModifiers.None, _persistableModelTInterface.Arguments[0], null, [dataParameter, _serializationOptionsParameter], ExplicitInterface: _persistableModelTInterface),
                This.Invoke(PersistableModelCreateCoreMethodName, [dataParameter, _serializationOptionsParameter]).CastTo(_model.Type),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> GetFormatFromOptions method.
        /// </summary>
        internal MethodProvider BuildPersistableModelGetFormatFromOptionsMethod()
        {
            ValueExpression jsonWireFormat = SystemSnippet.JsonFormatSerialization;
            // string IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, MethodSignatureModifiers.None, typeof(string), null, [_serializationOptionsParameter], ExplicitInterface: _persistableModelTInterface),
                jsonWireFormat,
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{object}"/> GetFormatFromOptions method for the model object.
        /// </summary>
        internal MethodProvider BuildPersistableModelGetFormatFromOptionsObjectDeclaration()
        {
            ValueExpression jsonWireFormat = SystemSnippet.JsonFormatSerialization;
            var castToT = This.CastTo(_persistableModelTInterface);

            // string IPersistableModel<object>.GetFormatFromOptions(ModelReaderWriterOptions options) => ((IPersistableModel<T>)this).GetFormatFromOptions(options);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, MethodSignatureModifiers.None, typeof(string), null, [_serializationOptionsParameter], ExplicitInterface: _persistableModelObjectInterface),
                castToT.Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), [_serializationOptionsParameter]),
                this
            );
        }

        private MethodBodyStatement[] BuildJsonModelWriteMethodBody(MethodProvider jsonModelWriteCoreMethod)
        {
            var coreMethodSignature = jsonModelWriteCoreMethod.Signature;

            return
            [
                _utf8JsonWriterSnippet.WriteStartObject(),
                This.Invoke(coreMethodSignature.Name, [.. coreMethodSignature.Parameters]).Terminate(),
                _utf8JsonWriterSnippet.WriteEndObject(),
            ];
        }

        private MethodBodyStatement[] BuildJsonModelWriteCoreMethodBody()
        {
            return
            [
                CreateValidateJsonFormat(_persistableModelTInterface, WriteAction),
                CallBaseJsonModelWriteCore(),
                CreateWritePropertiesStatements(),
                CreateWriteAdditionalPropertiesStatement(),
                CreateWriteAdditionalRawDataStatement()
            ];
        }

        private MethodBodyStatement[] BuildDeserializationMethodBody()
        {
            // Build the deserialization statements for each property
            ForeachStatement deserializePropertiesForEachStatement = new("prop", _jsonElementParameterSnippet.EnumerateObject(), out var prop)
            {
                BuildDeserializePropertiesStatements(prop.As<JsonProperty>())
            };

            return
            [
                new IfStatement(_jsonElementParameterSnippet.ValueKindEqualsNull()) { Return(Null) },
                GetPropertyVariableDeclarations(),
                deserializePropertiesForEachStatement,
                Return(New.Instance(_model.Type, GetSerializationCtorParameterValues()))
            ];
        }

        private MethodBodyStatement GetPropertyVariableDeclarations()
        {
            var parameters = SerializationConstructor.Signature.Parameters;
            var propertyDeclarationStatements = new List<MethodBodyStatement>(parameters.Count);

            for (var i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property is { } property)
                {
                    var variableRef = property.AsVariableExpression;
                    if (property.IsAdditionalProperties)
                    {
                        // IDictionary<string, T> additionalTProperties = new Dictionary<string, T>();
                        propertyDeclarationStatements.Add(Declare(variableRef, new DictionaryExpression(property.Type, New.Instance(property.Type.PropertyInitializationType))));
                    }
                    else
                    {
                        var defaultValue = (property.IsDiscriminator && _model.DiscriminatorValue != null && property.Type.IsFrameworkType)
                           ? Literal(_model.DiscriminatorValue)
                           : Default;
                        propertyDeclarationStatements.Add(Declare(variableRef, defaultValue));
                    }
                }
                else
                {
                    // the fact that we get here means we have a field
                    Debug.Assert(parameter.Field != null);
                    var field = parameter.Field;
                    var fieldRef = field.AsVariableExpression;
                    if (field.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName)
                    {
                        // the raw data is kind of different because we assign it with an instance, not like others properties/fields
                        // IDictionary<string, BinaryData> additionalBinaryDataProperties = new Dictionary<string, BinaryData>();
                        propertyDeclarationStatements.Add(Declare(fieldRef, new DictionaryExpression(field.Type, New.Instance(field.Type.PropertyInitializationType))));
                    }
                    else
                    {
                        propertyDeclarationStatements.Add(Declare(fieldRef, Default));
                    }
                }
            }
            return propertyDeclarationStatements;
        }

        private MethodBodyStatement[] BuildPersistableModelWriteCoreMethodBody()
        {
            var switchCase = new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippets.JsonFormat,
                Return(Static(typeof(ModelReaderWriter)).Invoke(nameof(ModelReaderWriter.Write), [This, _mrwOptionsParameterSnippet])));
            var typeOfT = _persistableModelTInterface.Arguments[0];
            var defaultCase = SwitchCaseStatement.Default(
                ThrowValidationFailException(_mrwOptionsParameterSnippet.Format(), typeOfT, WriteAction));

            return
            [
                GetConcreteFormat(_mrwOptionsParameterSnippet, _persistableModelTInterface, out VariableExpression format),
                new SwitchStatement(format, [switchCase, defaultCase])
            ];
        }

        private MethodBodyStatement[] BuildPersistableModelCreateCoreMethodBody()
        {
            var typeForDeserialize = _model.IsUnknownDiscriminatorModel ? _model.Type.BaseType! : _model.Type;

            var switchCase = new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippets.JsonFormat,
                new MethodBodyStatement[]
                {
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentSnippets.Parse(_dataParameter), out var jsonDocumentVar)
                    {
                        Return(typeForDeserialize.Deserialize(jsonDocumentVar.As<JsonDocument>().RootElement(), _serializationOptionsParameter))
                    },
               });
            var typeOfT = _persistableModelTInterface.Arguments[0];
            var defaultCase = SwitchCaseStatement.Default(
                ThrowValidationFailException(_mrwOptionsParameterSnippet.Format(), typeOfT, ReadAction));

            return
            [
                GetConcreteFormat(_mrwOptionsParameterSnippet, _persistableModelTInterface, out VariableExpression format),
                new SwitchStatement(format, [switchCase, defaultCase])
            ];
        }

        private MethodBodyStatement CallBaseJsonModelWriteCore()
        {
            // base.<JsonModelWriteCore>()
            return _shouldOverrideMethods ?
                Base.Invoke(JsonModelWriteCoreMethodName, [_utf8JsonWriterParameter, _serializationOptionsParameter]).Terminate()
                : MethodBodyStatement.Empty;
        }

        /// <summary>
        /// Builds the values for the serialization constructor parameters.
        /// </summary>
        private ValueExpression[] GetSerializationCtorParameterValues()
        {
            var parameters = SerializationConstructor.Signature.Parameters;
            ValueExpression[] serializationCtorParameters = new ValueExpression[parameters.Count];

            // Map property variable names to their corresponding parameter values
            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property is { } property)
                {
                    serializationCtorParameters[i] = GetValueForSerializationConstructor(property);
                    continue;
                }
                else
                {
                    var field = parameter.Field;
                    Debug.Assert(field != null);
                    serializationCtorParameters[i] = field.AsVariableExpression;
                }
            }

            return serializationCtorParameters;
        }

        private static ValueExpression GetValueForSerializationConstructor(PropertyProvider propertyProvider)
        {
            var isRequired = propertyProvider.WireInfo?.IsRequired ?? false;

            if (!propertyProvider.Type.IsFrameworkType || propertyProvider.IsAdditionalProperties)
            {
                return propertyProvider.AsVariableExpression;
            }
            else if (!isRequired)
            {
                return OptionalSnippets.FallBackToChangeTrackingCollection(propertyProvider.AsVariableExpression, propertyProvider.Type);
            }

            return propertyProvider.AsVariableExpression;
        }

        private List<MethodBodyStatement> BuildDeserializePropertiesStatements(ScopedApi<JsonProperty> jsonProperty)
        {
            List<MethodBodyStatement> propertyDeserializationStatements = [];
            Dictionary<JsonValueKind, List<MethodBodyStatement>> additionalPropsValueKindBodyStatements = [];
            var parameters = SerializationConstructor.Signature.Parameters;

            // Create each property's deserialization statement
            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property is { } property)
                {
                    // handle additional properties
                    if (property != _additionalBinaryDataProperty && property.IsAdditionalProperties)
                    {
                        AddAdditionalPropertiesValueKindStatements(additionalPropsValueKindBodyStatements, property, jsonProperty);
                        continue;
                    }

                    // By default, we should only deserialize properties with wire info. Those properties without wire info indicate they are not spec properties.
                    if (property.WireInfo is not { } wireInfo)
                    {
                        continue;
                    }
                    var propertySerializationName = wireInfo.SerializedName;
                    var checkIfJsonPropEqualsName = new IfStatement(jsonProperty.NameEquals(propertySerializationName))
                    {
                        DeserializeProperty(property, jsonProperty)
                    };
                    propertyDeserializationStatements.Add(checkIfJsonPropEqualsName);
                }
                else
                {
                    Debug.Assert(parameter.Field != null);
                }
            }

            // Add the additional properties deserialization switch statement
            if (additionalPropsValueKindBodyStatements.Count > 0)
            {
                propertyDeserializationStatements.Add(
                    CreateDeserializeAdditionalPropsValueKindCheck(jsonProperty, additionalPropsValueKindBodyStatements));
            }

            // deserialize the raw binary data for the model
            var rawBinaryData = _rawDataField
                ?? _model.BaseModelProvider?.Fields.FirstOrDefault(f => f.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);

            if (_additionalBinaryDataProperty != null)
            {
                var binaryDataDeserializationValue = GetValueTypeDeserializationExpression(
                    _additionalBinaryDataProperty.Type.ElementType.FrameworkType, jsonProperty.Value(), SerializationFormat.Default);
                propertyDeserializationStatements.Add(
                    _additionalBinaryDataProperty.AsVariableExpression.AsDictionary(_additionalBinaryDataProperty.Type).Add(jsonProperty.Name(), binaryDataDeserializationValue));
            }
            else if (rawBinaryData != null)
            {
                var elementType = rawBinaryData.Type.Arguments[1].FrameworkType;
                var rawDataDeserializationValue = GetValueTypeDeserializationExpression(elementType, jsonProperty.Value(), SerializationFormat.Default);
                propertyDeserializationStatements.Add(new IfStatement(_isNotEqualToWireConditionSnippet)
                {
                    rawBinaryData.AsVariableExpression.AsDictionary(rawBinaryData.Type).Add(jsonProperty.Name(), rawDataDeserializationValue)
                });
            }

            return propertyDeserializationStatements;
        }

        private void AddAdditionalPropertiesValueKindStatements(
            Dictionary<JsonValueKind, List<MethodBodyStatement>> additionalPropsValueKindBodyStatements,
            PropertyProvider additionalPropertiesProperty,
            ScopedApi<JsonProperty> jsonProperty)
        {
            DictionaryExpression additionalPropsDict = additionalPropertiesProperty.AsVariableExpression.AsDictionary(additionalPropertiesProperty.Type);
            var valueType = additionalPropertiesProperty.Type.ElementType;

            // Handle the known verifiable additional property value types
            if (valueType.IsFrameworkType && AdditionalPropertiesHelper.VerifiableAdditionalPropertyTypes.Contains(valueType.FrameworkType))
            {
                switch (valueType.FrameworkType)
                {
                    case Type t when t == typeof(string):
                        AddStatements(JsonValueKind.String,
                        [
                            DeserializeValue(valueType, jsonProperty.Value(), SerializationFormat.Default, out ValueExpression stringValue),
                            additionalPropsDict.Add(jsonProperty.Name(), stringValue),
                            Continue
                        ]);
                        break;
                    case Type t when t == typeof(bool):
                        AddStatements(JsonValueKind.True,
                        [
                            DeserializeValue(valueType, jsonProperty.Value(), SerializationFormat.Default, out ValueExpression boolValue),
                            additionalPropsDict.Add(jsonProperty.Name(), boolValue),
                            Continue
                        ]);
                        break;
                    case Type t when t == typeof(float):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetSingle(out ScopedApi<float> floatValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), floatValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(byte):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetByte(out ScopedApi<byte> byteValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), byteValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(byte[]):
                        AddStatements(JsonValueKind.String,
                        [
                            new IfStatement(jsonProperty.Value().TryGetBytesFromBase64(out ScopedApi<byte[]> byteArray))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), byteArray),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(sbyte):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetSByte(out ScopedApi<sbyte> sbyteValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), sbyteValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(DateTime):
                        AddStatements(JsonValueKind.String,
                        [
                            new IfStatement(jsonProperty.Value().TryGetDateTime(out ScopedApi<DateTime> dateTimeValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), dateTimeValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(DateTimeOffset):
                        AddStatements(JsonValueKind.String,
                        [
                            new IfStatement(jsonProperty.Value().TryGetDateTimeOffset(out ScopedApi<DateTimeOffset> dateTimeOffsetValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), dateTimeOffsetValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(Guid):
                        AddStatements(JsonValueKind.String,
                        [
                            new IfStatement(jsonProperty.Value().TryGetGuid(out ScopedApi<Guid> guidValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), guidValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(decimal):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetDecimal(out ScopedApi<decimal> decimalValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), decimalValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(double):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetDouble( out ScopedApi<double> doubleValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), doubleValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(short):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetInt16(out ScopedApi<short> shortValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), shortValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(int):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetInt32(out ScopedApi<int> intValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), intValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(long):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetInt64(out ScopedApi<long> longValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), longValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(ushort):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetUInt16(out ScopedApi<ushort> ushortValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), ushortValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(uint):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetUInt32(out ScopedApi<uint> uintValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), uintValue),
                                Continue
                            },
                        ]);
                        break;
                    case Type t when t == typeof(ulong):
                        AddStatements(JsonValueKind.Number,
                        [
                            new IfStatement(jsonProperty.Value().TryGetUInt64(out ScopedApi<ulong> ulongValue))
                            {
                                additionalPropsDict.Add(jsonProperty.Name(), ulongValue),
                                Continue
                            },
                        ]);
                        break;
                    default:
                        throw new InvalidOperationException($"Unable to generate additional properties value type validation for type {valueType.FrameworkType}.");
                }

                return;
            }

            if (valueType.IsList || valueType.IsDictionary)
            {
                var valueKind = valueType.IsList ? JsonValueKind.Array : JsonValueKind.Object;
                AddStatements(valueKind,
                [
                    DeserializeValue(valueType, jsonProperty.Value(), SerializationFormat.Default, out ValueExpression value),
                    additionalPropsDict.Add(jsonProperty.Name(), value),
                    Continue
                ]);

                return;
            }

            // Local function to add statements to the value kind checks dictionary
            void AddStatements(JsonValueKind valueKind, MethodBodyStatement[] statements)
            {
                if (!additionalPropsValueKindBodyStatements.TryGetValue(valueKind, out var checks))
                {
                    checks = [];
                    additionalPropsValueKindBodyStatements[valueKind] = checks;
                }
                checks.AddRange(statements);
            }
        }

        private static SwitchStatement CreateDeserializeAdditionalPropsValueKindCheck(
            ScopedApi<JsonProperty> jsonProperty,
            Dictionary<JsonValueKind, List<MethodBodyStatement>> additionalPropsValueKindBodyStatements)
        {
            var switchCases = new List<SwitchCaseStatement>(additionalPropsValueKindBodyStatements.Count);
            // Create the switch cases for each value kind, using the supplied built body statements
            foreach (var (valueKind, statements) in additionalPropsValueKindBodyStatements)
            {
                switch (valueKind)
                {
                    case JsonValueKind.String:
                        switchCases.Add(new(JsonValueKindSnippets.String, statements));
                        break;
                    case JsonValueKind.True:
                        switchCases.Add(new SwitchCaseStatement(
                            BoolSnippets.Or(JsonValueKindSnippets.True.As<bool>(), JsonValueKindSnippets.False), statements));
                        break;
                    case JsonValueKind.Number:
                        statements.Add(Break);
                        switchCases.Add(new SwitchCaseStatement(JsonValueKindSnippets.Number, statements));
                        break;
                    case JsonValueKind.Array:
                        switchCases.Add(new SwitchCaseStatement(JsonValueKindSnippets.Array, statements));
                        break;
                    case JsonValueKind.Object:
                        switchCases.Add(new SwitchCaseStatement(JsonValueKindSnippets.Object, statements));
                        break;
                    default:
                        throw new InvalidOperationException($"Unable to generate additional properties value kind switch case for {valueKind}.");
                }
            }

            return new SwitchStatement(jsonProperty.ValueKind(), switchCases);
        }

        private MethodBodyStatement[] DeserializeProperty(
            PropertyProvider property,
            ScopedApi<JsonProperty> jsonProperty)
        {
            var serializationFormat = property.WireInfo?.SerializationFormat ?? SerializationFormat.Default;
            var propertyVarReference = property.AsVariableExpression;

            return
            [
                DeserializationPropertyNullCheckStatement(property, jsonProperty, propertyVarReference),
                DeserializeValue(property.Type, jsonProperty.Value(), serializationFormat, out ValueExpression value),
                propertyVarReference.Assign(value).Terminate(),
                Continue
            ];
        }

        /// <summary>
        /// This method constructs the deserialization property null check statement for the json property
        /// <paramref name="jsonProperty"/>. If the property is required, the method will return a null check
        /// with an assignment to the property variable. If the property is not required, the method will simply
        /// return a null check for the json property.
        /// </summary>
        private static MethodBodyStatement DeserializationPropertyNullCheckStatement(
            PropertyProvider property,
            ScopedApi<JsonProperty> jsonProperty,
            VariableExpression propertyVarRef)
        {
            // Produces: if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            var checkEmptyProperty = jsonProperty.Value().ValueKindEqualsNull();
            CSharpType serializedType = property.Type;
            var propertyIsRequired = property.WireInfo?.IsRequired ?? false;

            if (serializedType.IsNullable)
            {
                if (!serializedType.IsCollection)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        propertyVarRef.Assign(Null).Terminate(),
                        Continue
                    };
                }

                if (propertyIsRequired && !serializedType.IsValueType)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        propertyVarRef.Assign(New.Instance(serializedType.PropertyInitializationType)).Terminate(),
                        Continue
                    };
                }

                return new IfStatement(checkEmptyProperty) { Continue };
            }

            if ((propertyIsRequired && !serializedType.IsReadOnlyMemory)
                || serializedType.Equals(typeof(JsonElement))
                || serializedType.Equals(typeof(string)))
            {
                return MethodBodyStatement.Empty;
            }

            return new IfStatement(checkEmptyProperty) { Continue };
        }

        private MethodBodyStatement DeserializeValue(
            CSharpType valueType,
            ScopedApi<JsonElement> jsonElement,
            SerializationFormat serializationFormat,
            out ValueExpression value)
        {
            if (valueType.IsList || valueType.IsArray)
            {
                if (valueType.IsArray && valueType.ElementType.IsReadOnlyMemory)
                {
                    var array = new VariableExpression(valueType.ElementType.PropertyInitializationType, "array");
                    var index = new VariableExpression(typeof(int), "index");
                    var deserializeReadOnlyMemory = new MethodBodyStatement[]
                    {
                        Declare(index, Int(0)),
                        Declare(array, New.Array(valueType.ElementType, jsonElement.GetArrayLength())),
                        ForeachStatement.Create("item", jsonElement.EnumerateArray(), out ScopedApi<JsonElement> item).Add(new MethodBodyStatement[]
                        {
                             NullCheckCollectionItemIfRequired(valueType.ElementType, item, item.Assign(Null).Terminate(),
                                new MethodBodyStatement[]
                                {
                                    DeserializeValue(valueType.ElementType, item, serializationFormat, out ValueExpression deserializedArrayElement),
                                    item.Assign(deserializedArrayElement).Terminate(),
                                }),
                            index.Increment().Terminate()
                        })
                    };
                    value = New.Instance(valueType.ElementType, array);
                    return deserializeReadOnlyMemory;
                }

                var deserializeArrayStatement = new MethodBodyStatement[]
                {
                    Declare("array", New.List(valueType.ElementType), out var listVariable),
                    ForeachStatement.Create("item", jsonElement.EnumerateArray(), out ScopedApi<JsonElement> arrayItem).Add(new MethodBodyStatement[]
                    {
                       NullCheckCollectionItemIfRequired(valueType.ElementType, arrayItem, listVariable.Add(Null), new MethodBodyStatement[]
                        {
                            DeserializeValue(valueType.ElementType, arrayItem, serializationFormat, out ValueExpression deserializedListElement),
                            listVariable.Add(deserializedListElement),
                        })
                    })
                };
                value = listVariable;
                return deserializeArrayStatement;
            }
            else if (valueType.IsDictionary)
            {
                var deserializeDictionaryStatement = new MethodBodyStatement[]
                {
                    Declare("dictionary", New.Dictionary(valueType.Arguments[0], valueType.Arguments[1]), out var dictionary),
                    ForeachStatement.Create("prop", jsonElement.EnumerateObject(), out ScopedApi<JsonProperty> prop).Add(new MethodBodyStatement[]
                    {
                        CreateDeserializeDictionaryValueStatement(valueType.ElementType, dictionary, prop, serializationFormat)
                    })
                };
                value = dictionary;
                return deserializeDictionaryStatement;
            }
            else
            {
                value = CreateDeserializeValueExpression(valueType, serializationFormat, jsonElement);
                return MethodBodyStatement.Empty;
            }
        }

        private ValueExpression CreateDeserializeValueExpression(CSharpType valueType, SerializationFormat serializationFormat, ScopedApi<JsonElement> jsonElement) =>
            valueType switch
            {
                { IsFrameworkType: true } when valueType.FrameworkType == typeof(Nullable<>) =>
                    GetValueTypeDeserializationExpression(valueType.Arguments[0].FrameworkType, jsonElement, serializationFormat),
                { IsFrameworkType: true } =>
                    GetValueTypeDeserializationExpression(valueType.FrameworkType, jsonElement, serializationFormat),
                { IsEnum: true } =>
                    valueType.ToEnum(GetValueTypeDeserializationExpression(valueType.UnderlyingEnumType!, jsonElement, serializationFormat)),
                _ => valueType.Deserialize(jsonElement, _mrwOptionsParameterSnippet)
            };

        private MethodBodyStatement CreateDeserializeDictionaryValueStatement(
            CSharpType dictionaryItemType,
            DictionaryExpression dictionary,
            ScopedApi<JsonProperty> property,
            SerializationFormat serializationFormat)
        {
            var deserializeValueBlock = new MethodBodyStatement[]
            {
                DeserializeValue(dictionaryItemType, property.Value(), serializationFormat, out var value),
                dictionary.Add(property.Name(), value)
            };

            if (TypeRequiresNullCheckInSerialization(dictionaryItemType))
            {
                return new IfElseStatement
                (
                    property.Value().ValueKindEqualsNull(),
                    dictionary.Add(property.Name(), Null),
                    deserializeValueBlock
                );
            }

            return deserializeValueBlock;
        }

        private static MethodBodyStatement NullCheckCollectionItemIfRequired(
            CSharpType collectionItemType,
            ScopedApi<JsonElement> arrayItemVar,
            MethodBodyStatement assignNull,
            MethodBodyStatement deserializeValue)
            => TypeRequiresNullCheckInSerialization(collectionItemType)
                ? new IfElseStatement(arrayItemVar.ValueKindEqualsNull(), assignNull, deserializeValue)
                : deserializeValue;

        private ConstructorProvider BuildEmptyConstructor()
        {
            var accessibility = _isStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new ConstructorProvider(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", accessibility, Array.Empty<ParameterProvider>()),
                bodyStatements: new MethodBodyStatement(),
                this);
        }

        /// <summary>
        /// Produces the validation body statements for the JSON serialization format.
        /// </summary>
        private MethodBodyStatement CreateValidateJsonFormat(CSharpType modelInterface, string action)
        {
            /*
                var format = options.Format == "W" ? GetFormatFromOptions(options) : options.Format;
                if (format != <formatValue>)
                {
                    throw new FormatException($"The model {nameof(ThisModel)} does not support '{format}' format.");
                }
            */
            MethodBodyStatement[] statements =
            [
                GetConcreteFormat(_mrwOptionsParameterSnippet, modelInterface, out VariableExpression format),
                new IfStatement(format.NotEqual(ModelReaderWriterOptionsSnippets.JsonFormat))
                {
                    ThrowValidationFailException(format, modelInterface.Arguments[0], action)
                },
            ];

            return statements;
        }

        private MethodBodyStatement GetConcreteFormat(ScopedApi<ModelReaderWriterOptions> options, CSharpType iModelTInterface, out VariableExpression format)
        {
            var cast = This.CastTo(iModelTInterface);
            var invokeGetFormatFromOptions = cast.Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), options);
            var condition = new TernaryConditionalExpression(
                options.Format().Equal(ModelReaderWriterOptionsSnippets.WireFormat),
                invokeGetFormatFromOptions,
                options.Format());
            var reference = new VariableExpression(typeof(string), "format");
            format = reference;
            return Declare(reference, condition);
        }

        private static MethodBodyStatement ThrowValidationFailException(ValueExpression format, CSharpType modelType, string action)
            => Throw(New.Instance(
                typeof(FormatException),
                new FormattableStringExpression($"The model {{{0}}} does not support {action} '{{{1}}}' format.",
                [
                    Nameof(modelType),
                    format
                ])));

        /// <summary>
        /// Constructs the body statements for the JsonModelWriteCore method containing the serialization for the model properties.
        /// </summary>
        private MethodBodyStatement[] CreateWritePropertiesStatements()
        {
            var propertyCount = _model.Properties.Count;
            List<MethodBodyStatement> propertyStatements = new(propertyCount);
            for (int i = 0; i < propertyCount; i++)
            {
                var property = _model.Properties[i];
                // we should only write those properties with a wire info. Those properties without wireinfo indicate they are not spec properties.
                if (property.WireInfo is not { } wireInfo)
                {
                    continue;
                }
                var propertySerializationName = wireInfo.SerializedName;
                var propertySerializationFormat = wireInfo.SerializationFormat;
                var propertyIsReadOnly = wireInfo.IsReadOnly;
                var propertyIsRequired = wireInfo.IsRequired;
                var propertyIsNullable = wireInfo.IsNullable;

                // Generate the serialization statements for the property
                var writePropertySerializationStatements = new MethodBodyStatement[]
                {
                    _utf8JsonWriterSnippet.WritePropertyName(propertySerializationName),
                    CreateSerializationStatement(property.Type, property, propertySerializationFormat)
                };

                // Wrap the serialization statement in a check for whether the property is defined
                var wrapInIsDefinedStatement = WrapInIsDefined(property, property, propertyIsRequired, propertyIsReadOnly, propertyIsNullable, writePropertySerializationStatements);
                if (propertyIsReadOnly && wrapInIsDefinedStatement is not IfStatement)
                {
                    wrapInIsDefinedStatement = new IfStatement(_isNotEqualToWireConditionSnippet)
                    {
                        wrapInIsDefinedStatement
                    };
                }
                propertyStatements.Add(wrapInIsDefinedStatement);
            }

            return [.. propertyStatements];
        }

        /// <summary>
        /// Wraps the serialization statement in a condition check to ensure only initialized and required properties are serialized.
        /// </summary>
        /// <param name="propertyProvider">The model property.</param>
        /// <param name="propertyMemberExpression">The expression representing the property to serialize.</param>
        /// <param name="writePropertySerializationStatement">The serialization statement to conditionally execute.</param>
        /// <returns>A method body statement that includes condition checks before serialization.</returns>
        private MethodBodyStatement WrapInIsDefined(
            PropertyProvider propertyProvider,
            MemberExpression propertyMemberExpression,
            bool propertyIsRequired,
            bool propertyIsReadOnly,
            bool propertyIsNullable,
            MethodBodyStatement writePropertySerializationStatement)
        {
            var propertyType = propertyProvider.Type;

            // Create the first conditional statement to check if the property is defined
            if (propertyIsNullable)
            {
                writePropertySerializationStatement = CheckPropertyIsInitialized(
                propertyProvider,
                propertyIsRequired,
                propertyMemberExpression,
                writePropertySerializationStatement);
            }

            // Directly return the statement if the property is required or a non-nullable value type that is not JsonElement
            if (IsRequiredOrNonNullableValueType(propertyType, propertyIsRequired))
            {
                return writePropertySerializationStatement;
            }

            // Conditionally serialize based on whether the property is a collection or a single value
            return CreateConditionalSerializationStatement(propertyType, propertyMemberExpression, propertyIsReadOnly, writePropertySerializationStatement);
        }

        private IfElseStatement CheckPropertyIsInitialized(
            PropertyProvider propertyProvider,
            bool isPropRequired,
            MemberExpression propertyMemberExpression,
            MethodBodyStatement writePropertySerializationStatement)
        {
            var propertyType = propertyProvider.Type;
            var propertySerialization = propertyProvider.WireInfo;
            var propertyName = propertySerialization?.SerializedName ?? propertyProvider.Name;
            ScopedApi<bool> propertyIsInitialized;

            if (propertyType.IsCollection && !propertyType.IsReadOnlyMemory && isPropRequired)
            {
                propertyIsInitialized = propertyMemberExpression.NotEqual(Null)
                    .And(OptionalSnippets.IsCollectionDefined(propertyMemberExpression));
            }
            else
            {
                propertyIsInitialized = propertyMemberExpression.NotEqual(Null);
            }

            return new IfElseStatement(
                propertyIsInitialized,
                writePropertySerializationStatement,
                _utf8JsonWriterSnippet.WriteNull(propertyName.ToVariableName()));
        }

        /// <summary>
        /// Creates a serialization statement for the specified type.
        /// </summary>
        /// <param name="serializationType">The type being serialized.</param>
        /// <param name="value">The value to be serialized.</param>
        /// <param name="serializationFormat">The serialization format.</param>
        /// <returns>The serialization statement.</returns>
        /// <exception cref="NotSupportedException">Thrown when the serialization type is not supported.</exception>
        private MethodBodyStatement CreateSerializationStatement(
            CSharpType serializationType,
            ValueExpression value,
            SerializationFormat serializationFormat) => serializationType switch
            {
                { IsDictionary: true } =>
                    CreateDictionarySerializationStatement(
                        value.AsDictionary(serializationType),
                        serializationFormat),
                { IsList: true } or { IsArray: true } =>
                    CreateListSerializationStatement(GetEnumerableExpression(value, serializationType), serializationFormat),
                { IsCollection: false } =>
                    CreateValueSerializationStatement(serializationType, serializationFormat, value),
                _ => throw new NotSupportedException($"Serialization of type {serializationType.Name} is not supported.")
            };

        private MethodBodyStatement CreateDictionarySerializationStatement(
            DictionaryExpression dictionary,
            SerializationFormat serializationFormat)
        {
            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartObject(),
                new ForeachStatement("item", dictionary, out KeyValuePairExpression keyValuePair)
                {
                    _utf8JsonWriterSnippet.WritePropertyName(keyValuePair.Key),
                    TypeRequiresNullCheckInSerialization(keyValuePair.ValueType) ?
                    new IfStatement(keyValuePair.Value.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue }: MethodBodyStatement.Empty,
                    CreateSerializationStatement(keyValuePair.ValueType, keyValuePair.Value, serializationFormat)
                },
                _utf8JsonWriterSnippet.WriteEndObject()
            };
        }

        private MethodBodyStatement CreateListSerializationStatement(
            ScopedApi array,
            SerializationFormat serializationFormat)
        {
            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartArray(),
                new ForeachStatement("item", array, out VariableExpression item)
                {
                    TypeRequiresNullCheckInSerialization(item.Type) ?
                    new IfStatement(item.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue } : MethodBodyStatement.Empty,
                    CreateSerializationStatement(item.Type, item, serializationFormat)
                },
                _utf8JsonWriterSnippet.WriteEndArray()
            };
        }

        private MethodBodyStatement CreateValueSerializationStatement(
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value)
        {
            if (type.IsFrameworkType)
                return SerializeValueType(type, serializationFormat, value, type.FrameworkType);

            if (!type.IsEnum)
                return _utf8JsonWriterSnippet.WriteObjectValue(value.As(type), options: _mrwOptionsParameterSnippet);

            var enumerableSnippet = value.NullableStructValue(type).As(type);
            if (type.IsStruct) //is extensible
            {
                if (type.UnderlyingEnumType.Equals(typeof(string)))
                    return _utf8JsonWriterSnippet.WriteStringValue(enumerableSnippet.Invoke(nameof(ToString)));

                return _utf8JsonWriterSnippet.WriteNumberValue(enumerableSnippet.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));
            }
            else
            {
                if (type.UnderlyingEnumType.Equals(typeof(int)))
                    // when the fixed enum is implemented as int, we cast to the value
                    return _utf8JsonWriterSnippet.WriteNumberValue(enumerableSnippet.CastTo(type.UnderlyingEnumType));

                if (type.UnderlyingEnumType.Equals(typeof(string)))
                    return _utf8JsonWriterSnippet.WriteStringValue(enumerableSnippet.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));

                return _utf8JsonWriterSnippet.WriteNumberValue(enumerableSnippet.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));
            }
        }

        private MethodBodyStatement SerializeValueType(
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value,
            Type valueType)
        {
            if (valueType == typeof(Nullable<>))
            {
                valueType = type.Arguments[0].FrameworkType;
            }

            value = value.NullableStructValue(type);

            return valueType switch
            {
                var t when t == typeof(JsonElement) =>
                    value.As<JsonElement>().WriteTo(_utf8JsonWriterSnippet),
                var t when ValueTypeIsInt(t) && serializationFormat == SerializationFormat.Int_String =>
                    _utf8JsonWriterSnippet.WriteStringValue(value.InvokeToString()),
                var t when ValueTypeIsNumber(t) =>
                    _utf8JsonWriterSnippet.WriteNumberValue(value),
                var t when t == typeof(object) =>
                    _utf8JsonWriterSnippet.WriteObjectValue(value.As(valueType), _mrwOptionsParameterSnippet),
                var t when t == typeof(string) || t == typeof(char) || t == typeof(Guid) =>
                    _utf8JsonWriterSnippet.WriteStringValue(value),
                var t when t == typeof(bool) =>
                    _utf8JsonWriterSnippet.WriteBooleanValue(value),
                var t when t == typeof(byte[]) =>
                    _utf8JsonWriterSnippet.WriteBase64StringValue(value, serializationFormat.ToFormatSpecifier()),
                var t when t == typeof(DateTimeOffset) || t == typeof(DateTime) || t == typeof(TimeSpan) =>
                    SerializeDateTimeRelatedTypes(valueType, serializationFormat, value),
                var t when t == typeof(IPAddress) =>
                    _utf8JsonWriterSnippet.WriteStringValue(value.InvokeToString()),
                var t when t == typeof(Uri) =>
                    _utf8JsonWriterSnippet.WriteStringValue(new MemberExpression(value, nameof(Uri.AbsoluteUri))),
                var t when t == typeof(BinaryData) =>
                    SerializeBinaryData(valueType, serializationFormat, value),
                var t when t == typeof(Stream) =>
                    _utf8JsonWriterSnippet.WriteBinaryData(BinaryDataSnippets.FromStream(value, false)),
                _ => throw new NotSupportedException($"Type {valueType} serialization is not supported.")
            };
        }

        public static ValueExpression GetValueTypeDeserializationExpression(
            Type valueType,
            ScopedApi<JsonElement> element,
            SerializationFormat format)
        {
            return valueType switch
            {
                Type t when t == typeof(Uri) =>
                    New.Instance(valueType, element.GetString()),
                Type t when t == typeof(IPAddress) =>
                    Static<IPAddress>().Invoke(nameof(IPAddress.Parse), element.GetString()),
                Type t when t == typeof(BinaryData) =>
                    format is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                        ? BinaryDataSnippets.FromBytes(element.GetBytesFromBase64(format.ToFormatSpecifier()))
                        : BinaryDataSnippets.FromString(element.GetRawText()),
                Type t when t == typeof(Stream) =>
                    BinaryDataSnippets.FromString(element.GetRawText()).ToStream(),
                Type t when t == typeof(JsonElement) =>
                    element.InvokeClone(),
                Type t when t == typeof(object) =>
                    element.GetObject(),
                Type t when t == typeof(bool) =>
                    element.GetBoolean(),
                Type t when t == typeof(char) =>
                    element.GetChar(),
                Type t when ValueTypeIsInt(t) =>
                    GetIntTypeDeserializationExpress(element, t, format),
                Type t when t == typeof(float) =>
                    element.GetSingle(),
                Type t when t == typeof(double) =>
                    element.GetDouble(),
                Type t when t == typeof(decimal) =>
                    element.GetDecimal(),
                Type t when t == typeof(string) =>
                    element.GetString(),
                Type t when t == typeof(Guid) =>
                    element.GetGuid(),
                Type t when t == typeof(byte[]) =>
                    element.GetBytesFromBase64(format.ToFormatSpecifier()),
                Type t when t == typeof(DateTimeOffset) =>
                    format == SerializationFormat.DateTime_Unix
                        ? DateTimeOffsetSnippets.FromUnixTimeSeconds(element.GetInt64())
                        : element.GetDateTimeOffset(format.ToFormatSpecifier()),
                Type t when t == typeof(DateTime) =>
                    element.GetDateTime(),
                Type t when t == typeof(TimeSpan) => format switch
                {
                    SerializationFormat.Duration_Seconds => TimeSpanSnippets.FromSeconds(element.GetInt32()),
                    SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double => TimeSpanSnippets.FromSeconds(element.GetDouble()),
                    _ => element.GetTimeSpan(format.ToFormatSpecifier())
                },
                _ => throw new NotSupportedException($"Framework type {valueType} is not supported.")
            };
        }

        private static bool ValueTypeIsInt(Type valueType) =>
            valueType == typeof(long) ||
            valueType == typeof(int) ||
            valueType == typeof(short) ||
            valueType == typeof(sbyte) ||
            valueType == typeof(byte);

        private static bool ValueTypeIsNumber(Type valueType) =>
            valueType == typeof(decimal) ||
            valueType == typeof(double) ||
            valueType == typeof(float) ||
            ValueTypeIsInt(valueType);

        private static ValueExpression GetIntTypeDeserializationExpress(ScopedApi<JsonElement> element, Type type, SerializationFormat format) => format switch
        {
            // when `@encode(string)`, the type is serialized as string, so we need to deserialize it from string
            // sbyte.Parse(element.GetString())
            SerializationFormat.Int_String => new InvokeMethodExpression(type, nameof(int.Parse), [element.GetString()]),
            _ => type switch
            {
                Type t when t == typeof(long) => element.GetInt64(),
                Type t when t == typeof(int) => element.GetInt32(),
                Type t when t == typeof(short) => element.GetInt16(),
                Type t when t == typeof(sbyte) => element.GetSByte(),
                Type t when t == typeof(byte) => element.GetByte(),
                _ => throw new NotSupportedException($"Framework type {type} is not int.")
            }
        };

        private MethodBodyStatement SerializeDateTimeRelatedTypes(Type valueType, SerializationFormat serializationFormat, ValueExpression value)
        {
            var format = serializationFormat.ToFormatSpecifier();
            return serializationFormat switch
            {
                SerializationFormat.Duration_Seconds => _utf8JsonWriterSnippet.WriteNumberValue(ConvertSnippets.InvokeToInt32(value.As<TimeSpan>().InvokeToString(format))),
                SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double => _utf8JsonWriterSnippet.WriteNumberValue(ConvertSnippets.InvokeToDouble(value.As<TimeSpan>().InvokeToString(format))),
                SerializationFormat.DateTime_Unix => _utf8JsonWriterSnippet.WriteNumberValue(value, format),
                _ => format is not null ? _utf8JsonWriterSnippet.WriteStringValue(value, format) : _utf8JsonWriterSnippet.WriteStringValue(value)
            };
        }

        private MethodBodyStatement SerializeBinaryData(Type valueType, SerializationFormat serializationFormat, ValueExpression value)
        {
            if (serializationFormat is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url)
            {
                return _utf8JsonWriterSnippet.WriteBase64StringValue(value.As<BinaryData>().ToArray(), serializationFormat.ToFormatSpecifier());
            }
            return _utf8JsonWriterSnippet.WriteBinaryData(value);
        }

        private static ScopedApi GetEnumerableExpression(ValueExpression expression, CSharpType enumerableType)
        {
            CSharpType itemType = enumerableType.IsReadOnlyMemory ? new CSharpType(typeof(ReadOnlySpan<>), enumerableType.Arguments[0]) :
                enumerableType.ElementType;

            return expression.As(new CSharpType(typeof(IEnumerable<>), itemType));
        }

        private static bool IsRequiredOrNonNullableValueType(CSharpType propertyType, bool isRequired)
            => isRequired || (!propertyType.IsNullable && propertyType.IsValueType && !propertyType.Equals(typeof(JsonElement)));

        private IfStatement CreateConditionalSerializationStatement(
            CSharpType propertyType,
            MemberExpression propertyMemberExpression,
            bool isReadOnly,
            MethodBodyStatement writePropertySerializationStatement)
        {
            var isDefinedCondition = propertyType.IsCollection && !propertyType.IsReadOnlyMemory
                ? OptionalSnippets.IsCollectionDefined(propertyMemberExpression)
                : OptionalSnippets.IsDefined(propertyMemberExpression);
            var condition = isReadOnly ? _isNotEqualToWireConditionSnippet.And(isDefinedCondition) : isDefinedCondition;

            return new IfStatement(condition) { writePropertySerializationStatement };
        }

        /// <summary>
        /// Builds the JSON write core body statement for the additional binary data.
        /// </summary>
        /// <returns>The method body statement that writes the additional binary data.</returns>
        private MethodBodyStatement CreateWriteAdditionalRawDataStatement()
        {
            if (_rawDataField == null || _additionalBinaryDataProperty != null)
            {
                return MethodBodyStatement.Empty;
            }

            var rawDataMemberExp = new MemberExpression(null, _rawDataField.Name);
            var rawDataDictionaryExp = rawDataMemberExp.AsDictionary(_rawDataField.Type);
            var forEachStatement = new ForeachStatement("item", rawDataDictionaryExp, out KeyValuePairExpression item)
            {
                _utf8JsonWriterSnippet.WritePropertyName(item.Key),
                CreateSerializationStatement(_rawDataField.Type.Arguments[1], item.Value, SerializationFormat.Default),
            };

            return new IfStatement(_isNotEqualToWireConditionSnippet.And(rawDataDictionaryExp.NotEqual(Null)))
            {
                forEachStatement,
            };
        }

        private MethodBodyStatement CreateWriteAdditionalPropertiesStatement()
        {
            if (_inputModel.AdditionalProperties == null || AdditionalProperties.Length == 0)
            {
                return MethodBodyStatement.Empty;
            }

            var statements = new MethodBodyStatement[AdditionalProperties.Length];
            for (int i = 0; i < AdditionalProperties.Length; i++)
            {
                var additionalPropertiesProperty = AdditionalProperties[i];
                var tKey = additionalPropertiesProperty.Type.Arguments[0];
                var tValue = additionalPropertiesProperty.Type.Arguments[1];
                // generate serialization statements for each key-value pair in the additional properties dictionary
                var forEachStatement = new ForeachStatement("item", additionalPropertiesProperty.AsDictionary(tKey, tValue), out KeyValuePairExpression item)
                {
                    _utf8JsonWriterSnippet.WritePropertyName(item.Key),
                    CreateSerializationStatement(additionalPropertiesProperty.Type.Arguments[1], item.Value, SerializationFormat.Default),
                };
                statements[i] = forEachStatement;
            }

            return statements;
        }

        private PropertyProvider? GetAdditionalBinaryDataPropertiesProp()
        {
            PropertyProvider? property = _model.Properties.FirstOrDefault(
                p => p.BackingField?.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);
            // search in the base model if the property is not found in the current model
            return property ?? _model.BaseModelProvider?.Properties.FirstOrDefault(
                p => p.BackingField?.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);
        }

        private static bool TypeRequiresNullCheckInSerialization(CSharpType type)
        {
            if (type.IsCollection)
            {
                return true;
            }
            else if (type.IsNullable && type.IsValueType) // nullable value type
            {
                return true;
            }
            else if (!type.IsValueType && type.IsFrameworkType
                && (type.FrameworkType != typeof(string) || type.FrameworkType != typeof(byte[])))
            {
                // reference type, excluding string or byte[]
                return true;
            }

            return false;
        }
    }
}
