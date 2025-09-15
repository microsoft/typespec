// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.ClientModel.Utilities;
using Microsoft.TypeSpec.Generator.EmitterRpc;
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
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    public class MrwSerializationTypeDefinition : TypeProvider
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
        private readonly Lazy<PropertyProvider?> _additionalBinaryDataProperty;
        private readonly Lazy<PropertyProvider?> _jsonPatchProperty;
        private readonly bool _isStruct;
        private ConstructorProvider? _serializationConstructor;
        // Flag to determine if the model should override the serialization methods
        private readonly bool _shouldOverrideMethods;
        private readonly Lazy<PropertyProvider[]> _additionalProperties;

        public MrwSerializationTypeDefinition(InputModelType inputModel, ModelProvider modelProvider)
        {
            _model = modelProvider;
            _jsonPatchProperty = new(GetBaseJsonPatchProperty);
            _inputModel = inputModel;
            _isStruct = _model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            // Initialize the serialization interfaces
            var interfaceType = inputModel.IsUnknownDiscriminatorModel ? ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel.BaseModel!)! : _model;
            _jsonModelTInterface = new CSharpType(typeof(IJsonModel<>), interfaceType.Type);
            _jsonModelObjectInterface = _isStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _persistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), interfaceType.Type);
            _persistableModelObjectInterface = _isStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            _rawDataField = _model.Fields.FirstOrDefault(f => f.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);
            _additionalBinaryDataProperty = new(GetAdditionalBinaryDataPropertiesProp);
            _additionalProperties = new(() => [.. _model.Properties.Where(p => p.IsAdditionalProperties)]);
            _shouldOverrideMethods = _model.Type.BaseType != null && !_isStruct && _model.Type.BaseType is { IsFrameworkType: false };
            _utf8JsonWriterSnippet = _utf8JsonWriterParameter.As<Utf8JsonWriter>();
            _mrwOptionsParameterSnippet = _serializationOptionsParameter.As<ModelReaderWriterOptions>();
            _jsonElementParameterSnippet = _jsonElementDeserializationParam.As<JsonElement>();
            _isNotEqualToWireConditionSnippet = _mrwOptionsParameterSnippet.Format().NotEqual(ModelReaderWriterOptionsSnippets.WireFormat);
        }

        protected override FormattableString BuildDescription() => _model.Description;

        protected override string BuildNamespace() => _model.Type.Namespace;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _model.DeclarationModifiers;
        private ConstructorProvider SerializationConstructor => _serializationConstructor ??= _model.FullConstructor;
        private PropertyProvider[] AdditionalProperties => _additionalProperties.Value;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");

        protected override string BuildName() => _inputModel.Name.ToIdentifierName();

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            if (_model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
            {
                var unknownVariant = _model.DerivedModels.FirstOrDefault(m => m.IsUnknownDiscriminatorModel);
                if (unknownVariant != null)
                {
                    return [new AttributeStatement(typeof(PersistableModelProxyAttribute), TypeOf(unknownVariant.Type))];
                }
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
                if (ScmCodeModelGenerator.Instance.TypeFactory.RootInputModels.Contains(_inputModel))
                {
                    methods.Add(BuildImplicitToBinaryContent());
                }

                if (ScmCodeModelGenerator.Instance.TypeFactory.RootOutputModels.Contains(_inputModel))
                {
                    methods.Add(BuildExplicitFromClientResult());
                }
            }

            if (_isStruct)
            {
                methods.Add(BuildJsonModelWriteMethodObjectDeclaration());
                methods.Add(BuildJsonModelCreateMethodObjectDeclaration());
                methods.Add(BuildPersistableModelWriteMethodObjectDeclaration());
                methods.Add(BuildPersistableModelGetFormatFromOptionsObjectDeclaration());
                methods.Add(BuildPersistableModelCreateMethodObjectDeclaration());
            }

            if (_model is ScmModelProvider { IsDynamicModel: true, HasDynamicProperties: true } scmModel)
            {
                var dynamicModelProvider = new DynamicModelMethodProvider(scmModel);
                methods.AddRange(dynamicModelProvider.BuildMethods());
            }

            return [.. methods];
        }

        private MethodProvider BuildExplicitFromClientResult()
        {
            var result = new ParameterProvider("result", $"The {ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType:C} to deserialize the {Type:C} from.", ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;
            // using PipelineResponse response = result.GetRawResponse();
            var responseDeclaration = UsingDeclare("response", ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.HttpResponseType, result.ToApi<ClientResponseApi>().GetRawResponse(), out var response);
            // using JsonDocument document = JsonDocument.Parse(response.Content);
            var data = Declare("data", typeof(BinaryData), response.Property(nameof(HttpResponseApi.Content)), out var dataVariable);
            var document = UsingDeclare(
                "document",
                typeof(JsonDocument),
                dataVariable.As<BinaryData>().Parse(),
                out var docVariable);
            // return DeserializeT(doc.RootElement, data, ModelSerializationExtensions.WireOptions);
            var deserialize = Return(_model.Type.Deserialize(docVariable.As<JsonDocument>().RootElement(), dataVariable, ModelSerializationExtensionsSnippets.Wire));
            var methodBody = new MethodBodyStatement[]
            {
                responseDeclaration,
                data,
                document,
                deserialize
            };
            return new MethodProvider(
                new MethodSignature(Type.Name, null, modifiers, Type, null, [result]),
                methodBody,
                this);
        }

        private MethodProvider BuildImplicitToBinaryContent()
        {
            var requestContentType = ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType;
            var model = new ParameterProvider(Type.Name.ToVariableName(), $"The {Type:C} to serialize into {requestContentType:C}", Type);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;
            // return BinaryContent.Create(model, ModelSerializationExtensions.WireOptions);
            return new MethodProvider(
                new MethodSignature(ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType.FrameworkType.Name, null, modifiers, requestContentType, null, [model]),
                new MethodBodyStatement[]
                {
                    !_isStruct ? new IfStatement(model.Equal(Null)) { Return(Null) } : MethodBodyStatement.Empty,
                    ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.ToExpression().Create(model)
                },
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
              castToT.Invoke(nameof(IJsonModel<object>.Create), [_utf8JsonReaderParameter.AsArgument(), _serializationOptionsParameter]),
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
            MethodSignatureModifiers modifiers = _isStruct
                ? MethodSignatureModifiers.Private
                : MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
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
            MethodSignatureModifiers modifiers = _isStruct
                ? MethodSignatureModifiers.Private
                : MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;

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
            MethodSignatureModifiers modifiers = _isStruct
                ? MethodSignatureModifiers.Private
                : MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;

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
            ValueExpression createCoreInvocation = This.Invoke(JsonModelCreateCoreMethodName, [_utf8JsonReaderParameter.AsArgument(), _serializationOptionsParameter]);
            var createCoreReturnType = _model.Type.RootType;

            // If the return type of the create core method is not the same as the interface type, cast it to the interface type since
            // the Core methods will always return the root type of the model. The interface type will be the model type unless the model
            // is an unknown discriminated model.
            if (createCoreReturnType != _jsonModelTInterface.Arguments[0])
            {
                createCoreInvocation = createCoreInvocation.CastTo(_model.Type);
            }

            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);
            return new MethodProvider
            (
                new MethodSignature(nameof(IJsonModel<object>.Create), null, MethodSignatureModifiers.None, _jsonModelTInterface.Arguments[0], null, [_utf8JsonReaderParameter, _serializationOptionsParameter], ExplicitInterface: _jsonModelTInterface),
                createCoreInvocation,
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IJsonModel{T}"/> create core method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateCoreMethod()
        {
            MethodSignatureModifiers modifiers = _isStruct
                ? MethodSignatureModifiers.Private
                : MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;

            if (_shouldOverrideMethods)
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            var typeForDeserialize = _model.IsUnknownDiscriminatorModel ? _model.Type.BaseType! : _model.Type;

            var methodBody = new MethodBodyStatement[]
            {
                CreateValidateJsonFormat( _persistableModelTInterface, ReadAction),
                // using var document = JsonDocument.ParseValue(ref reader);
                UsingDeclare("document", typeof(JsonDocument), JsonDocumentSnippets.ParseValue(_utf8JsonReaderParameter.AsArgument()), out var docVariable),
                // return DeserializeT(doc.RootElement, options);
                Return(typeForDeserialize.Deserialize(JsonDocumentSnippets.RootElement(docVariable.As<JsonDocument>()), Null, _mrwOptionsParameterSnippet))
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
              new MethodSignature(methodName, null, signatureModifiers, _model.Type, null, [_jsonElementDeserializationParam, _dataParameter, _serializationOptionsParameter]),
              _inputModel.DiscriminatedSubtypes.Count > 0 ? BuildDiscriminatedModelDeserializationMethodBody() : BuildDeserializationMethodBody(),
              this
            );
        }

        private MethodBodyStatement[] BuildDiscriminatedModelDeserializationMethodBody()
        {
            var unknownVariant = _model.DerivedModels.First(m => m.IsUnknownDiscriminatorModel);
            bool onlyContainsUnknownDerivedModel = _model.DerivedModels.Count == 1;
            var discriminator = _model.CanonicalView.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
            var deserializeDiscriminatedModelsConditions = BuildDiscriminatedModelsCondition(
                discriminator,
                GetDiscriminatorSwitchCases(unknownVariant),
                onlyContainsUnknownDerivedModel,
                _jsonElementParameterSnippet);

            return
            [
                new IfStatement(_jsonElementParameterSnippet.ValueKindEqualsNull()) { Return(Null) },
                deserializeDiscriminatedModelsConditions,
                Return(unknownVariant.Type.Deserialize(_jsonElementParameterSnippet, _dataParameter, _serializationOptionsParameter))
            ];
        }

        private static MethodBodyStatement BuildDiscriminatedModelsCondition(
            PropertyProvider? discriminatorProperty,
            SwitchCaseStatement[] abstractSwitchCases,
            bool onlyContainsUnknownDerivedModel,
            ScopedApi<JsonElement> jsonElementParameterSnippet)
        {
            if (!onlyContainsUnknownDerivedModel && discriminatorProperty?.WireInfo?.SerializedName != null)
            {
                return new IfStatement(jsonElementParameterSnippet.TryGetProperty(
                    discriminatorProperty.WireInfo.SerializedName,
                    out var discriminator))
                {
                    new SwitchStatement(discriminator.GetString(), abstractSwitchCases)
                };
            }

            return MethodBodyStatement.Empty;
        }

        private SwitchCaseStatement[] GetDiscriminatorSwitchCases(ModelProvider unknownVariant)
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
                    Return(model.Type.Deserialize(_jsonElementParameterSnippet, _dataParameter, _serializationOptionsParameter)));
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
            ValueExpression createCoreInvocation = This.Invoke(PersistableModelCreateCoreMethodName, [dataParameter, _serializationOptionsParameter]);
            var createCoreReturnType = _model.Type.RootType;

            // If the return type of the create core method is not the same as the interface type, cast it to the interface type since
            // the Core methods will always return the root type of the model. The interface type will be the model type unless the model
            // is an unknown discriminated model.
            if (createCoreReturnType != _persistableModelTInterface.Arguments[0])
            {
                createCoreInvocation = createCoreInvocation.CastTo(_model.Type);
            }
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Create), null, MethodSignatureModifiers.None, _persistableModelTInterface.Arguments[0], null, [dataParameter, _serializationOptionsParameter], ExplicitInterface: _persistableModelTInterface),
                createCoreInvocation,
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
            List<MethodBodyStatement>? rootJsonPatchStatements = null;

            if (_jsonPatchProperty.Value != null)
            {
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                IfStatement condition = new(_jsonPatchProperty.Value.As<JsonPatch>().Contains(LiteralU8("$")))
                {
                    _utf8JsonWriterSnippet.WriteRawValue(_jsonPatchProperty.Value.As<JsonPatch>().GetJson(LiteralU8("$"))),
                    Return()
                };
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

                rootJsonPatchStatements =
                [
                    new SuppressionStatement(
                        condition,
                        Literal(ScmModelProvider.ScmEvaluationTypeDiagnosticId),
                        ScmModelProvider.ScmEvaluationTypeSuppressionJustification),
                    MethodBodyStatement.EmptyLine
                ];
            }

            return
            [
                rootJsonPatchStatements ?? MethodBodyStatement.Empty,
                _utf8JsonWriterSnippet.WriteStartObject(),
                This.Invoke(coreMethodSignature.Name, [.. coreMethodSignature.Parameters]).Terminate(),
                _utf8JsonWriterSnippet.WriteEndObject(),
            ];
        }

        private MethodBodyStatement[] BuildJsonModelWriteCoreMethodBody()
        {
            List<MethodBodyStatement> writePropertiesStatements =
            [
                CreateWritePropertiesStatements(),
                CreateWriteAdditionalPropertiesStatement(),
            ];

            if (_jsonPatchProperty.Value != null)
            {
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                writePropertiesStatements.AddRange(
                    MethodBodyStatement.EmptyLine,
                    _jsonPatchProperty.Value.As<JsonPatch>().WriteTo( _utf8JsonWriterSnippet).Terminate());
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                writePropertiesStatements =
                [
                    new SuppressionStatement(
                        writePropertiesStatements,
                        Literal(ScmModelProvider.ScmEvaluationTypeDiagnosticId),
                        ScmModelProvider.ScmEvaluationTypeSuppressionJustification)
                ];
            }

            return
            [
                CreateValidateJsonFormat(_persistableModelTInterface, WriteAction),
                CallBaseJsonModelWriteCore(),
                writePropertiesStatements,
                CreateWriteAdditionalRawDataStatement()
            ];
        }

        private MethodBodyStatement[] BuildDeserializationMethodBody()
        {
            // Build the deserialization statements for each property
            ForEachStatement deserializePropertiesForEachStatement = new("prop", _jsonElementParameterSnippet.EnumerateObject(), out var prop)
            {
                BuildDeserializePropertiesStatements(prop.As<JsonProperty>(), _dataParameter.As<BinaryData>())
            };

            var valueKindEqualsNullReturn = _isStruct ? Return(Default) : Return(Null);

            return
            [
                new IfStatement(_jsonElementParameterSnippet.ValueKindEqualsNull()) { valueKindEqualsNullReturn },
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
                        if (variableRef.Type.IsReadOnlyDictionary)
                        {
                            variableRef.Update(type: variableRef.Type.PropertyInitializationType);
                        }
                        // IDictionary<string, T> additionalTProperties = new Dictionary<string, T>();
                        propertyDeclarationStatements.Add(Declare(variableRef, new DictionaryExpression(property.Type, New.Instance(property.Type.PropertyInitializationType))));
                    }
                    else if (property.Name.Equals(ScmModelProvider.JsonPatchPropertyName) &&
                        _model is ScmModelProvider { HasDynamicModelSupport: true })
                    {
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                        var patchAssignment = New.Instance<JsonPatch>(
                            new TernaryConditionalExpression(
                                _dataParameter.Is(Null),
                                ReadOnlyMemorySnippets.Empty(),
                                _dataParameter.As<BinaryData>().ToMemory()));
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                        var jsonPatchDeclaration = new SuppressionStatement(
                            Declare(variableRef, patchAssignment),
                            Literal(ScmModelProvider.ScmEvaluationTypeDiagnosticId),
                            ScmModelProvider.ScmEvaluationTypeSuppressionJustification);
                        propertyDeclarationStatements.Add(jsonPatchDeclaration);
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
                Return(Static(typeof(ModelReaderWriter)).Invoke(nameof(ModelReaderWriter.Write), [This, _mrwOptionsParameterSnippet, ModelReaderWriterContextSnippets.Default])));
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
                        Return(typeForDeserialize.Deserialize(jsonDocumentVar.As<JsonDocument>().RootElement(), _dataParameter, _serializationOptionsParameter))
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
                return propertyProvider.Type.IsReadOnlyDictionary
                    ? New.ReadOnlyDictionary(propertyProvider.Type.Arguments[0], propertyProvider.Type.ElementType, propertyProvider.AsVariableExpression)
                    : propertyProvider.AsVariableExpression;
            }
            else if (!isRequired)
            {
                return OptionalSnippets.FallBackToChangeTrackingCollection(propertyProvider.AsVariableExpression, propertyProvider.Type);
            }

            return propertyProvider.AsVariableExpression;
        }

        private List<MethodBodyStatement> BuildDeserializePropertiesStatements(ScopedApi<JsonProperty> jsonProperty, ScopedApi<BinaryData> data)
        {
            List<MethodBodyStatement> propertyDeserializationStatements = [];
            Dictionary<JsonValueKind, List<MethodBodyStatement>> additionalPropsValueKindBodyStatements = [];
            var parameters = SerializationConstructor.Signature.Parameters;

            // Parse the custom serialization attributes
            List<AttributeStatement> serializationAttributes = _model.CustomCodeView?.Attributes
                .Where(a => a.Type.Name == CodeGenAttributes.CodeGenSerializationAttributeName)
                .ToList() ?? [];
            var baseModelProvider = _model.BaseModelProvider;

            while (baseModelProvider != null)
            {
                var customCodeView = baseModelProvider.CustomCodeView;
                if (customCodeView != null)
                {
                    serializationAttributes
                        .AddRange(customCodeView.Attributes
                        .Where(a => a.Type.Name == CodeGenAttributes.CodeGenSerializationAttributeName));
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            // Create each property's deserialization statement
            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.Property != null || parameter.Field != null)
                {
                    // handle additional properties
                    if (parameter.Property != null && parameter.Property != _additionalBinaryDataProperty.Value && parameter.Property.IsAdditionalProperties)
                    {
                        AddAdditionalPropertiesValueKindStatements(additionalPropsValueKindBodyStatements, parameter.Property, jsonProperty, data);
                        continue;
                    }

                    var wireInfo = parameter.Property?.WireInfo ?? parameter.Field?.WireInfo;

                    // By default, we should only deserialize properties with wire info that are payload properties.
                    // Those properties without wire info indicate they are not spec properties.
                    if (wireInfo == null || wireInfo.IsHttpMetadata == true)
                    {
                        continue;
                    }
                    var propertySerializationName = wireInfo.SerializedName;
                    var propertyName = parameter.Property?.Name ?? parameter.Field?.Name;
                    var propertyType = parameter.Property?.Type ?? parameter.Field?.Type;
                    var propertyExpression = parameter.Property?.AsVariableExpression ?? parameter.Field?.AsVariableExpression;
                    var checkIfJsonPropEqualsName = new IfStatement(jsonProperty.NameEquals(propertySerializationName))
                    {
                        DeserializeProperty(propertyName!, propertyType!, wireInfo, propertyExpression!, jsonProperty, data, serializationAttributes)
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

            // deserialize the raw binary data for the model by searching for the raw binary data field in the model and any base models.
            var rawBinaryData = _rawDataField;
            if (rawBinaryData == null)
            {
                baseModelProvider = _model.BaseModelProvider;
                while (baseModelProvider != null)
                {
                    var field = baseModelProvider.Fields.FirstOrDefault(f => f.Name == AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName);
                    if (field != null)
                    {
                        rawBinaryData = field;
                        break;
                    }
                    baseModelProvider = baseModelProvider.BaseModelProvider;
                }
            }

            if (_additionalBinaryDataProperty.Value != null)
            {
                var binaryDataDeserializationValue = ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(
                    _additionalBinaryDataProperty.Value.Type.ElementType.FrameworkType, jsonProperty.Value(), _dataParameter.As<BinaryData>(), _mrwOptionsParameterSnippet, SerializationFormat.Default);
                propertyDeserializationStatements.Add(
                    _additionalBinaryDataProperty.Value.AsVariableExpression.AsDictionary(_additionalBinaryDataProperty.Value.Type).Add(jsonProperty.Name(), binaryDataDeserializationValue));
            }
            else if (rawBinaryData != null)
            {
                var elementType = rawBinaryData.Type.Arguments[1].FrameworkType;
                var rawDataDeserializationValue = ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(elementType, jsonProperty.Value(), _dataParameter.As<BinaryData>(), _mrwOptionsParameterSnippet, SerializationFormat.Default);
                propertyDeserializationStatements.Add(new IfStatement(_isNotEqualToWireConditionSnippet)
                {
                    rawBinaryData.AsVariableExpression.AsDictionary(rawBinaryData.Type).Add(jsonProperty.Name(), rawDataDeserializationValue)
                });
            }
            else if (_jsonPatchProperty.Value != null)
            {
                // If we have a JsonPatch property, we want to add any unknown properties to the patch
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
                var jsonPatchSet = _jsonPatchProperty.Value.AsVariableExpression.As<JsonPatch>().Set(
                    IndexerExpression.FromCollection(Spread(LiteralU8("$.")), Spread(Utf8Snippets.GetBytes(jsonProperty.Name()))),
                    jsonProperty.Value().GetUtf8Bytes());
                propertyDeserializationStatements.Add(jsonPatchSet);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            }

            return propertyDeserializationStatements;
        }

        private void AddAdditionalPropertiesValueKindStatements(
            Dictionary<JsonValueKind, List<MethodBodyStatement>> additionalPropsValueKindBodyStatements,
            PropertyProvider additionalPropertiesProperty,
            ScopedApi<JsonProperty> jsonProperty,
            ScopedApi<BinaryData> data)
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
                            DeserializeValue(valueType, jsonProperty.Value(), data, SerializationFormat.Default, out ValueExpression stringValue),
                            additionalPropsDict.Add(jsonProperty.Name(), stringValue),
                            Continue
                        ]);
                        break;
                    case Type t when t == typeof(bool):
                        AddStatements(JsonValueKind.True,
                        [
                            DeserializeValue(valueType, jsonProperty.Value(), data, SerializationFormat.Default, out ValueExpression boolValue),
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
                    DeserializeValue(valueType, jsonProperty.Value(), data, SerializationFormat.Default, out ValueExpression value),
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
                            JsonValueKindSnippets.True.As<bool>().OrPattern(JsonValueKindSnippets.False), statements));
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
            string propertyName,
            CSharpType propertyType,
            PropertyWireInformation wireInfo,
            VariableExpression variableExpression,
            ScopedApi<JsonProperty> jsonProperty,
            ScopedApi<BinaryData> data,
            IEnumerable<AttributeStatement> serializationAttributes)
        {
            bool useCustomDeserializationHook = false;
            var serializationFormat = wireInfo.SerializationFormat;
            var propertyVarReference = variableExpression;
            var deserializationStatements = new MethodBodyStatement[2]
            {
                DeserializeValue(propertyType, jsonProperty.Value(), data, serializationFormat, out ValueExpression value),
                propertyVarReference.Assign(value).Terminate()
            };

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
                    deserializationStatements =
                        [Static().Invoke(
                            deserializationHook,
                            jsonProperty,
                            ByRef(propertyVarReference)).Terminate()];
                    useCustomDeserializationHook = true;
                    break;
                }
            }

            return
            [
                useCustomDeserializationHook
                    ? MethodBodyStatement.Empty
                    : DeserializationPropertyNullCheckStatement(propertyType, wireInfo, jsonProperty, propertyVarReference),
                deserializationStatements,
                Continue
            ];
        }

        private static MethodBodyStatement DeserializationPropertyNullCheckStatement(
            CSharpType propertyType,
            PropertyWireInformation wireInfo,
            ScopedApi<JsonProperty> jsonProperty,
            VariableExpression propertyVarRef)
        {
            // Produces: if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            var checkEmptyProperty = jsonProperty.Value().ValueKindEqualsNull();
            CSharpType serializedType = propertyType;
            var propertyIsRequired = wireInfo.IsRequired;

            if ((serializedType.IsNullable || !serializedType.IsValueType) && wireInfo.IsNullable)
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
            ScopedApi<BinaryData> data,
            SerializationFormat serializationFormat,
            out ValueExpression value)
        {
            if (valueType.IsList || valueType.IsArray)
            {
                if (valueType.IsReadOnlyMemory)
                {
                    var arrayVar = new VariableExpression(new CSharpType(valueType.ElementType.FrameworkType.MakeArrayType()), "array");
                    var index = new VariableExpression(typeof(int), "index");
                    var deserializeReadOnlyMemory = new MethodBodyStatement[]
                    {
                        Declare(index, Int(0)),
                        Declare(arrayVar, New.Array(valueType.ElementType, jsonElement.GetArrayLength())),
                        ForEachStatement.Create("item", jsonElement.EnumerateArray(), out ScopedApi<JsonElement> item).Add(new MethodBodyStatement[]
                        {
                             NullCheckCollectionItemIfRequired(valueType.ElementType, item, item.Assign(Null).Terminate(),
                                new MethodBodyStatement[]
                                {
                                    DeserializeValue(valueType.ElementType, item, data, serializationFormat, out ValueExpression deserializedArrayElement),
                                    new IndexableExpression(arrayVar)[index].Assign(deserializedArrayElement).Terminate(),
                                }),
                            index.Increment().Terminate()
                        })
                    };
                    value = New.Instance(new CSharpType(typeof(ReadOnlyMemory<>), valueType.ElementType), arrayVar);
                    return deserializeReadOnlyMemory;
                }

                var deserializeArrayStatement = new MethodBodyStatement[]
                {
                    Declare("array", New.List(valueType.ElementType), out var listVariable),
                    ForEachStatement.Create("item", jsonElement.EnumerateArray(), out ScopedApi<JsonElement> arrayItem).Add(new MethodBodyStatement[]
                    {
                       NullCheckCollectionItemIfRequired(valueType.ElementType, arrayItem, listVariable.Add(Null), new MethodBodyStatement[]
                        {
                            DeserializeValue(valueType.ElementType, arrayItem, data, serializationFormat, out ValueExpression deserializedListElement),
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
                    ForEachStatement.Create("prop", jsonElement.EnumerateObject(), out ScopedApi<JsonProperty> prop).Add(new MethodBodyStatement[]
                    {
                        CreateDeserializeDictionaryValueStatement(valueType.ElementType, dictionary, prop, data, serializationFormat)
                    })
                };
                value = dictionary;
                return deserializeDictionaryStatement;
            }
            else
            {
                value = CreateDeserializeValueExpression(valueType, serializationFormat, jsonElement, data);
                return MethodBodyStatement.Empty;
            }
        }

        private ValueExpression CreateDeserializeValueExpression(CSharpType valueType, SerializationFormat serializationFormat, ScopedApi<JsonElement> jsonElement, ScopedApi<BinaryData> data) =>
            valueType switch
            {
                { IsFrameworkType: true } when valueType.FrameworkType == typeof(Nullable<>) =>
                    ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(valueType.Arguments[0].FrameworkType, jsonElement, _dataParameter.As<BinaryData>(), _mrwOptionsParameterSnippet, serializationFormat),
                { IsFrameworkType: true } =>
                    ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(valueType.FrameworkType, jsonElement, _dataParameter.As<BinaryData>(), _mrwOptionsParameterSnippet, serializationFormat),
                { IsEnum: true } =>
                    valueType.ToEnum(ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(valueType.UnderlyingEnumType!, jsonElement, _dataParameter.As<BinaryData>(), _mrwOptionsParameterSnippet, serializationFormat)),
                _ => valueType.Deserialize(jsonElement, data, _mrwOptionsParameterSnippet)
            };

        private MethodBodyStatement CreateDeserializeDictionaryValueStatement(
            CSharpType dictionaryItemType,
            DictionaryExpression dictionary,
            ScopedApi<JsonProperty> property,
            ScopedApi<BinaryData> data,
            SerializationFormat serializationFormat)
        {
            var deserializeValueBlock = new MethodBodyStatement[]
            {
                DeserializeValue(dictionaryItemType, property.Value(), data, serializationFormat, out var value),
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
                bodyStatements: MethodBodyStatement.Empty,
                this);
        }

        private PropertyProvider? GetBaseJsonPatchProperty()
        {
            if (_model is not ScmModelProvider scmModelProvider)
            {
                return null;
            }

            if (scmModelProvider.JsonPatchProperty != null)
            {
                return scmModelProvider.JsonPatchProperty;
            }

            var baseModelProvider = scmModelProvider.BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider is ScmModelProvider baseScmModelProvider && baseScmModelProvider.JsonPatchProperty != null)
                {
                    return baseScmModelProvider.JsonPatchProperty;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            return null;
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
            List<MethodBodyStatement> propertyStatements = new();

            // we should only write those properties with wire info and are payload properties.
            // Those properties without wireinfo indicate they are not spec properties.
            foreach (var property in _model.CanonicalView.Properties)
            {
                if (property.WireInfo == null || property.WireInfo.IsHttpMetadata)
                {
                    continue;
                }

                propertyStatements.Add(CreateWritePropertyStatement(property.WireInfo, property.Type, property.Name, property));
            }

            foreach (var field in _model.CanonicalView.Fields)
            {
                if (field.WireInfo == null || field.WireInfo.IsHttpMetadata)
                {
                    continue;
                }

                propertyStatements.Add(CreateWritePropertyStatement(field.WireInfo, field.Type, field.Name, field));
            }

            return [.. propertyStatements];
        }

        private MethodBodyStatement CreateWritePropertyStatement(
            PropertyWireInformation wireInfo,
            CSharpType propertyType,
            string propertyName,
            MemberExpression propertyExpression)
        {
            var propertySerializationName = wireInfo.SerializedName;
            var propertySerializationFormat = wireInfo.SerializationFormat;
            var propertyIsReadOnly = wireInfo.IsReadOnly;
            var propertyIsRequired = wireInfo.IsRequired;
            var propertyIsNullable = wireInfo.IsNullable;

            // Generate the serialization statements for the property
            var serializationStatement = CreateSerializationStatement(propertyType, propertyExpression, propertySerializationFormat, propertySerializationName);

            // Check for custom serialization hooks
            foreach (var attribute in _model.CustomCodeView?.Attributes
                         .Where(a => a.Type.Name == CodeGenAttributes.CodeGenSerializationAttributeName) ?? [])
            {
                if (CodeGenAttributes.TryGetCodeGenSerializationAttributeValue(
                        attribute,
                        out var name,
                        out _,
                        out var serializationHook,
                        out _,
                        out _) && name == propertyName && serializationHook != null)
                {
                    serializationStatement = This.Invoke(
                            serializationHook,
                            _utf8JsonWriterSnippet,
                            _serializationOptionsParameter)
                        .Terminate();
                }
            }

            var writePropertySerializationStatements = new MethodBodyStatement[]
            {
                _utf8JsonWriterSnippet.WritePropertyName(propertySerializationName),
                serializationStatement
            };

            // Wrap the serialization statement in a check for whether the property is defined
            var wrapInIsDefinedStatement = WrapInIsDefined(
                propertyExpression,
                propertyType,
                wireInfo,
                propertyIsRequired,
                propertyIsReadOnly,
                propertyIsNullable,
                writePropertySerializationStatements);

            return wrapInIsDefinedStatement;
        }

        private MethodBodyStatement WrapInIsDefined(
            MemberExpression propertyExpression,
            CSharpType propertyType,
            PropertyWireInformation wireInfo,
            bool propertyIsRequired,
            bool propertyIsReadOnly,
            bool propertyIsNullable,
            MethodBodyStatement writePropertySerializationStatement)
        {
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            ScopedApi<bool>? patchCheck = _jsonPatchProperty.Value != null
                ? Not(_jsonPatchProperty.Value.As<JsonPatch>().Contains(LiteralU8($"$.{wireInfo.SerializedName}")))
                : null;
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            // Non-nullable value types or required non-nullable properties that aren't read-only
            // can be serialized directly with just patch checking
            if (!propertyIsReadOnly &&
                (IsNonNullableValueType(propertyType) || (propertyIsRequired && !propertyIsNullable)))
            {
                if (patchCheck == null)
                    return writePropertySerializationStatement;

                return (propertyType.IsList || propertyType.IsArray)
                    ? CreateConditionalPatchSerializationStatement(wireInfo.SerializedName, null, writePropertySerializationStatement, writePropertySerializationStatement)
                    : new IfStatement(patchCheck) { writePropertySerializationStatement };
            }

            // Everything else goes through conditional serialization
            return CreateConditionalSerializationStatement(
                propertyType,
                propertyExpression,
                propertyIsReadOnly,
                propertyIsNullable,
                propertyIsRequired,
                wireInfo.SerializedName,
                patchCheck,
                writePropertySerializationStatement);
        }

        /// <summary>
        /// Creates a serialization statement for the specified type.
        /// </summary>
        /// <param name="serializationType">The type being serialized.</param>
        /// <param name="value">The value to be serialized.</param>
        /// <param name="serializationFormat">The serialization format.</param>
        /// <returns>The serialization statement.</returns>
        private MethodBodyStatement CreateSerializationStatement(
            CSharpType serializationType,
            ValueExpression value,
            SerializationFormat serializationFormat,
            string serializedName)
        {
            MethodBodyStatement? statement = serializationType switch
            {
                { IsDictionary: true } =>
                    CreateDictionarySerializationStatement(
                        value.AsDictionary(serializationType),
                        serializationFormat,
                        serializedName),
                { IsList: true } or { IsArray: true } =>
                    CreateListSerializationStatement(GetEnumerableExpression(value, serializationType),
                        serializationFormat,
                        serializedName),
                { IsCollection: false } =>
                    CreateValueSerializationStatement(serializationType, serializationFormat, value),
                _ => null,
            };

            if (statement == null)
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                   DiagnosticCodes.UnsupportedSerialization,
                   $"Serialization of type {serializationType.Name} is not supported.",
                   severity: EmitterDiagnosticSeverity.Warning);
                return CreateValueSerializationStatement(serializationType, serializationFormat, value);
            }

            return statement;
        }

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

        private MethodBodyStatement CreateDictionarySerializationStatement(
           DictionaryExpression dictionary,
           SerializationFormat serializationFormat,
           string serializedName)
        {
            return _jsonPatchProperty.Value != null
                ? CreateDictionarySerializationWithPatch(
                    dictionary,
                    serializationFormat,
                    _jsonPatchProperty.Value.As<JsonPatch>(),
                    serializedName)
                : CreateDictionarySerialization(dictionary, serializationFormat, serializedName);
        }

        private MethodBodyStatement CreateDictionarySerializationWithPatch(
            DictionaryExpression dictionary,
            SerializationFormat serializationFormat,
            ScopedApi<JsonPatch> patchSnippet,
            string serializedName)
        {
            var bufferDeclaration = Declare(
                "buffer",
                new CSharpType(typeof(Span<byte>)),
                New.Array(typeof(byte), isStackAlloc: true, Int(256)), out var bufferVar);
            var foreachStatement = new ForEachStatement("item", dictionary, out KeyValuePairExpression keyValuePair);
            var bytesWrittenDeclaration = Declare(
                "bytesWritten",
                typeof(int),
                Utf8Snippets.GetBytes(keyValuePair.Key.Invoke("AsSpan"), bufferVar),
                out var bytesWrittenVar);

            // TO-DO: Handle non-string key
            var jsonPath = LiteralU8($"$.{serializedName}");
            var patchContainsKey = patchSnippet
                .Contains(
                    jsonPath,
                    Utf8Snippets.GetBytes(keyValuePair.Key.As<string>()));
            var patchContainsNet8Declaration = Declare(
                "patchContains",
                typeof(bool),
                new TernaryConditionalExpression(
                    bytesWrittenVar.Equal(Int(256)),
                    patchContainsKey,
                    patchSnippet.Contains(
                        jsonPath,
                        ReadOnlySpanSnippets.Slice(bufferVar, Int(0), bytesWrittenVar))),
                out var patchContainsNet8Var);

            var ifPatchDoesNotContainStatement = new IfStatement(Not(patchContainsNet8Var))
            {
                _utf8JsonWriterSnippet.WritePropertyName(keyValuePair.Key),
                TypeRequiresNullCheckInSerialization(keyValuePair.ValueType)
                    ? new IfStatement(keyValuePair.Value.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue }
                    : MethodBodyStatement.Empty,
                CreateSerializationStatement(keyValuePair.ValueType, keyValuePair.Value, serializationFormat, serializedName)
            };
            var innerIfElseProcessorStatement = new IfElsePreprocessorStatement(
                "NET8_0_OR_GREATER",
            new MethodBodyStatement[] { bytesWrittenDeclaration, patchContainsNet8Declaration },
                new DeclarationExpression(new VariableExpression(patchContainsNet8Var.Type, patchContainsNet8Var.Declaration))
                    .Assign(patchContainsKey)
                    .Terminate());

            foreachStatement.Add(innerIfElseProcessorStatement);
            foreachStatement.Add(ifPatchDoesNotContainStatement);

            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartObject(),
                new IfElsePreprocessorStatement("NET8_0_OR_GREATER", bufferDeclaration),
                foreachStatement,
                MethodBodyStatement.EmptyLine,
                patchSnippet.WriteTo(_utf8JsonWriterSnippet, jsonPath).Terminate(),
                _utf8JsonWriterSnippet.WriteEndObject(),
            };
        }

        private MethodBodyStatement CreateListSerializationStatement(
            ScopedApi array,
            SerializationFormat serializationFormat,
            string serializedName)
        {
            // Handle ReadOnlyMemory<T> serialization
            bool isReadOnlySpan = array.Type.ElementType.IsFrameworkType && array.Type.ElementType.FrameworkType == typeof(ReadOnlySpan<>);
            CSharpType itemType = isReadOnlySpan ? array.Type.ElementType.Arguments[0] : array.Type.Arguments[0];
            var collection = isReadOnlySpan
                ? array.NullableStructValue(array.Type.ElementType).Property(nameof(ReadOnlyMemory<byte>.Span))
                : array;

            return _jsonPatchProperty.Value != null
                ? CreateListSerializationWithPatch(
                    collection,
                    array.Type.IsArray ? "Length" : "Count",
                    itemType,
                    _jsonPatchProperty.Value.As<JsonPatch>(),
                    serializationFormat,
                    serializedName)
                : CreateListSerialization(collection, itemType, serializationFormat);
        }

        private MethodBodyStatement CreateListSerializationWithPatch(
            ValueExpression collection,
            string countPropertyName,
            CSharpType itemType,
            ScopedApi<JsonPatch> patchSnippet,
            SerializationFormat serializationFormat,
            string serializedName)
        {
            var indexDeclaration = Declare<int>("i", out var i);
            ScopedApi<bool> patchIsRemovedCondition;

            if (ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(itemType, out var provider) &&
                provider is ScmModelProvider scmModelProvider && scmModelProvider.JsonPatchProperty != null)
            {
                patchIsRemovedCondition = new IndexerExpression(collection, i)
                    .Property(scmModelProvider.JsonPatchProperty.Name)
                    .As<JsonPatch>()
                    .IsRemoved(LiteralU8("$"));
            }
            else
            {
                patchIsRemovedCondition = patchSnippet
                    .IsRemoved(Utf8Snippets.GetBytes(new FormattableStringExpression($"$.{serializedName}[{{0}}]", [i])
                    .As<string>()));
            }

            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartArray(),
                new ForStatement(indexDeclaration.Assign(Literal(0)), i.LessThan(collection.Property(countPropertyName)), i.Increment())
                {
                    new IfStatement(patchIsRemovedCondition)
                    {
                        Continue
                    },
                    CreateNullCheckAndSerializationStatement(itemType, new IndexerExpression(collection, i), serializationFormat, serializedName)
                },
                patchSnippet.WriteTo(_utf8JsonWriterSnippet, LiteralU8($"$.{serializedName}")).Terminate(),
                _utf8JsonWriterSnippet.WriteEndArray()
            };
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
        }

        private MethodBodyStatement CreateListSerialization(
            ValueExpression collection,
            CSharpType itemType,
            SerializationFormat serializationFormat)
        {
            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartArray(),
                new ForEachStatement(itemType, "item", collection, false, out VariableExpression item)
                {
                    CreateNullCheckAndSerializationStatement(itemType, item, serializationFormat, string.Empty)
                },
                _utf8JsonWriterSnippet.WriteEndArray()
            };
        }

        private MethodBodyStatement CreateDictionarySerialization(
            DictionaryExpression dictionary,
            SerializationFormat serializationFormat,
            string serializedName)
        {
            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartObject(),
                new ForEachStatement("item", dictionary, out KeyValuePairExpression keyValuePair)
                {
                    _utf8JsonWriterSnippet.WritePropertyName(keyValuePair.Key),
                    TypeRequiresNullCheckInSerialization(keyValuePair.ValueType) ?
                    new IfStatement(keyValuePair.Value.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue }: MethodBodyStatement.Empty,
                    CreateSerializationStatement(keyValuePair.ValueType, keyValuePair.Value, serializationFormat, serializedName)
                },
                _utf8JsonWriterSnippet.WriteEndObject()
            };
        }

        private MethodBodyStatement CreateNullCheckAndSerializationStatement(
            CSharpType itemType,
            ValueExpression element,
            SerializationFormat serializationFormat,
            string serializedName)
        {
            if (!TypeRequiresNullCheckInSerialization(itemType))
            {
                return CreateSerializationStatement(itemType, element, serializationFormat, serializedName);
            }

            return new[]
            {
                new IfStatement(element.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue },
                CreateSerializationStatement(itemType, element, serializationFormat, serializedName)
            };
        }

        private MethodBodyStatement CreateValueSerializationStatement(
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value)
        {
            // append the `.Value` if needed (when the type is nullable and a value type)
            value = value.NullableStructValue(type);

            // now we just need to focus on how we serialize a value
            if (type.IsFrameworkType)
                return ScmCodeModelGenerator.Instance.TypeFactory.SerializeJsonValue(type.FrameworkType, value, _utf8JsonWriterSnippet, _mrwOptionsParameterSnippet, serializationFormat);

            if (!type.IsEnum)
                return _utf8JsonWriterSnippet.WriteObjectValue(value.As(type), options: _mrwOptionsParameterSnippet);

            if (type.IsStruct) //is extensible
            {
                if (type.UnderlyingEnumType.Equals(typeof(string)))
                    return _utf8JsonWriterSnippet.WriteStringValue(value.Invoke(nameof(ToString)));

                return _utf8JsonWriterSnippet.WriteNumberValue(value.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));
            }
            else
            {
                if (type.UnderlyingEnumType.Equals(typeof(int)))
                    // when the fixed enum is implemented as int, we cast to the value
                    return _utf8JsonWriterSnippet.WriteNumberValue(value.CastTo(type.UnderlyingEnumType));

                if (type.UnderlyingEnumType.Equals(typeof(string)))
                    return _utf8JsonWriterSnippet.WriteStringValue(value.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));

                return _utf8JsonWriterSnippet.WriteNumberValue(value.Invoke($"ToSerial{type.UnderlyingEnumType.Name}"));
            }
        }

        internal static MethodBodyStatement SerializeJsonValueCore(
            Type valueType,
            ValueExpression value,
            ScopedApi<Utf8JsonWriter> utf8JsonWriter,
            ScopedApi<ModelReaderWriterOptions> mrwOptionsParameter,
            SerializationFormat serializationFormat)
        {
            MethodBodyStatement? statement = valueType switch
            {
                var t when t == typeof(JsonElement) =>
                    value.As<JsonElement>().WriteTo(utf8JsonWriter),
                var t when ValueTypeIsInt(t) && serializationFormat == SerializationFormat.Int_String =>
                    utf8JsonWriter.WriteStringValue(value.InvokeToString()),
                var t when ValueTypeIsNumber(t) =>
                    utf8JsonWriter.WriteNumberValue(value),
                var t when t == typeof(object) =>
                    utf8JsonWriter.WriteObjectValue(value.As(valueType), mrwOptionsParameter),
                var t when t == typeof(string) || t == typeof(char) || t == typeof(Guid) =>
                    utf8JsonWriter.WriteStringValue(value),
                var t when t == typeof(bool) =>
                    utf8JsonWriter.WriteBooleanValue(value),
                var t when t == typeof(byte[]) =>
                    utf8JsonWriter.WriteBase64StringValue(value, serializationFormat.ToFormatSpecifier()),
                var t when t == typeof(DateTimeOffset) || t == typeof(DateTime) || t == typeof(TimeSpan) =>
                    SerializeDateTimeRelatedTypes(valueType, serializationFormat, value, utf8JsonWriter, mrwOptionsParameter),
                var t when t == typeof(IPAddress) =>
                    utf8JsonWriter.WriteStringValue(value.InvokeToString()),
                var t when t == typeof(Uri) =>
                    utf8JsonWriter.WriteStringValue(new MemberExpression(value, nameof(Uri.AbsoluteUri))),
                var t when t == typeof(BinaryData) =>
                    SerializeBinaryData(valueType, serializationFormat, value, utf8JsonWriter),
                var t when t == typeof(Stream) =>
                    utf8JsonWriter.WriteBinaryData(BinaryDataSnippets.FromStream(value, false)),
                _ => null
            };

            if (statement is null)
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.UnsupportedSerialization,
                    $"Serialization of type {valueType.Name} is not supported.",
                    severity: EmitterDiagnosticSeverity.Warning);

                return utf8JsonWriter.WriteObjectValue(value.As(valueType), mrwOptionsParameter);
            }

            return statement;
        }

        internal static ValueExpression DeserializeJsonValueCore(
            Type valueType,
            ScopedApi<JsonElement> element,
            ScopedApi<BinaryData> data,
            ScopedApi<ModelReaderWriterOptions> mrwOptions,
            SerializationFormat format)
        {
            ValueExpression? exp = valueType switch
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
                _ => null,
            };

            if (exp is null)
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.UnsupportedSerialization,
                    $"Deserialization of type {valueType.Name} is not supported.",
                    severity: EmitterDiagnosticSeverity.Warning);
                return new CSharpType(valueType).Deserialize(element, data, mrwOptions);
            }

            return exp;
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

        private static MethodBodyStatement SerializeDateTimeRelatedTypes(Type valueType, SerializationFormat serializationFormat, ValueExpression value, ScopedApi<Utf8JsonWriter> utf8JsonWriter, ScopedApi<ModelReaderWriterOptions> mrwOptionsParameter)
        {
            var format = serializationFormat.ToFormatSpecifier();
            return serializationFormat switch
            {
                SerializationFormat.Duration_Seconds => utf8JsonWriter.WriteNumberValue(ConvertSnippets.InvokeToInt32(value.As<TimeSpan>().InvokeToString(format))),
                SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double => utf8JsonWriter.WriteNumberValue(ConvertSnippets.InvokeToDouble(value.As<TimeSpan>().InvokeToString(format))),
                SerializationFormat.DateTime_Unix => utf8JsonWriter.WriteNumberValue(value, format),
                _ => format is not null ? utf8JsonWriter.WriteStringValue(value, format) : utf8JsonWriter.WriteStringValue(value)
            };
        }

        private static MethodBodyStatement SerializeBinaryData(Type valueType, SerializationFormat serializationFormat, ValueExpression value, ScopedApi<Utf8JsonWriter> utf8JsonWriter)
        {
            if (serializationFormat is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url)
            {
                return utf8JsonWriter.WriteBase64StringValue(value.As<BinaryData>().ToArray(), serializationFormat.ToFormatSpecifier());
            }
            return utf8JsonWriter.WriteBinaryData(value);
        }

        private static ScopedApi GetEnumerableExpression(ValueExpression expression, CSharpType enumerableType)
        {
            CSharpType itemType = enumerableType.IsReadOnlyMemory
                ? new CSharpType(typeof(ReadOnlySpan<>), enumerableType.IsNullable, enumerableType.Arguments[0])
                : enumerableType.ElementType;

            return expression.As(new CSharpType(typeof(IEnumerable<>), itemType));
        }

        private static bool IsNonNullableValueType(CSharpType propertyType)
            => propertyType is { IsNullable: false, IsValueType: true } && !propertyType.Equals(typeof(JsonElement));

        private MethodBodyStatement CreateConditionalSerializationStatement(
            CSharpType propertyType,
            MemberExpression propertyMemberExpression,
            bool isReadOnly,
            bool isNullable,
            bool isRequired,
            string serializedName,
            ValueExpression? patchCheck,
            MethodBodyStatement writePropertySerializationStatement)
        {
            ScopedApi<bool> condition;
            bool shouldCheckJsonPath = patchCheck != null && (propertyType.IsList || propertyType.IsArray);

            if (isRequired && isReadOnly)
            {
                condition = patchCheck != null
                    ? _isNotEqualToWireConditionSnippet.And(patchCheck)
                    : _isNotEqualToWireConditionSnippet;

                // add an if / else if statement to first check if the patch property contains the json collection
                if (shouldCheckJsonPath)
                {
                    return CreateConditionalPatchSerializationStatement(
                        serializedName,
                        condition,
                        writePropertySerializationStatement,
                        null);
                }

                return new IfStatement(condition)
                {
                    writePropertySerializationStatement
                };
            }

            var isDefinedCondition = propertyType is { IsCollection: true, IsReadOnlyMemory: false }
                ? OptionalSnippets.IsCollectionDefined(propertyMemberExpression)
                : OptionalSnippets.IsDefined(propertyMemberExpression);

            if (patchCheck != null && !shouldCheckJsonPath)
            {
                isDefinedCondition = isDefinedCondition.And(patchCheck);
            }

            condition = isReadOnly ? _isNotEqualToWireConditionSnippet.And(isDefinedCondition) : isDefinedCondition;

            if (isRequired && isNullable)
            {
                if (shouldCheckJsonPath)
                {
                    return CreateConditionalPatchSerializationStatement(
                        serializedName,
                        condition,
                        writePropertySerializationStatement,
                        _utf8JsonWriterSnippet.WriteNull(serializedName));
                }

                return new IfElseStatement(
                    condition,
                    writePropertySerializationStatement,
                    _utf8JsonWriterSnippet.WriteNull(serializedName));
            }

            if (shouldCheckJsonPath)
            {
                return CreateConditionalPatchSerializationStatement(
                    serializedName,
                    condition,
                    writePropertySerializationStatement,
                    _utf8JsonWriterSnippet.WriteNull(serializedName));
            }

            return new IfStatement(condition) { writePropertySerializationStatement };
        }

        private IfElseStatement CreateConditionalPatchSerializationStatement(
            string serializedName,
            ScopedApi<bool>? condition,
            MethodBodyStatement writePropertySerializationStatement,
            MethodBodyStatement? elseStatementBody)
        {
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var ifPatchContainsJson = new IfStatement(
                _jsonPatchProperty.Value!.As<JsonPatch>().Contains(LiteralU8($"$.{serializedName}")))
            {
                _utf8JsonWriterSnippet.WritePropertyName(serializedName),
                _utf8JsonWriterSnippet.WriteRawValue(
                    JsonPatchSnippets.GetJson(_jsonPatchProperty.Value!.As<JsonPatch>(),
                    LiteralU8($"$.{serializedName}")))
            };
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            if (condition == null)
            {
                return new IfElseStatement(ifPatchContainsJson, [], elseStatementBody);
            }

            var elseifPropertyIsDefined = new IfStatement(condition)
            {
                writePropertySerializationStatement
            };
            return new IfElseStatement(ifPatchContainsJson, [elseifPropertyIsDefined], elseStatementBody);
        }

        /// <summary>
        /// Builds the JSON write core body statement for the additional binary data.
        /// </summary>
        /// <returns>The method body statement that writes the additional binary data.</returns>
        private MethodBodyStatement CreateWriteAdditionalRawDataStatement()
        {
            if (_rawDataField == null || _additionalBinaryDataProperty.Value != null)
            {
                return MethodBodyStatement.Empty;
            }

            var rawDataMemberExp = new MemberExpression(null, _rawDataField.Name);
            var rawDataDictionaryExp = rawDataMemberExp.AsDictionary(_rawDataField.Type);
            var forEachStatement = new ForEachStatement("item", rawDataDictionaryExp, out KeyValuePairExpression item)
            {
                _utf8JsonWriterSnippet.WritePropertyName(item.Key),
                CreateSerializationStatement(_rawDataField.Type.Arguments[1], item.Value, SerializationFormat.Default, _rawDataField.WireInfo?.SerializedName ?? _rawDataField.Name),
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
                var forEachStatement = new ForEachStatement("item", additionalPropertiesProperty.AsDictionary(tKey, tValue), out KeyValuePairExpression item)
                {
                    _utf8JsonWriterSnippet.WritePropertyName(item.Key),
                    CreateSerializationStatement(additionalPropertiesProperty.Type.Arguments[1], item.Value, SerializationFormat.Default, additionalPropertiesProperty.WireInfo?.SerializedName ?? additionalPropertiesProperty.Name),
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
