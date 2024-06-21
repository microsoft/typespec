// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal sealed class MrwSerializationTypeProvider : TypeProvider
    {
        private readonly ParameterProvider _serializationOptionsParameter =
            new("options", $"The client options for reading and writing models.", typeof(ModelReaderWriterOptions));
        private readonly ParameterProvider _mrwDeserializationOptionsParameter =
            new("options", $"The client options", new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true), Null);
        private const string PrivateAdditionalRawDataPropertyDescription = "Keeps track of any properties unknown to the library.";
        private const string PrivateAdditionalRawDataPropertyName = "_serializedAdditionalRawData";
        private const string AdditionalRawDataVarName = "serializedAdditionalRawData";
        private const string JsonModelWriteMethodName = $"{nameof(IJsonModel<object>.Write)}Core";
        private const string JsonModelCreateMethodName = $"{nameof(IJsonModel<object>.Create)}Core";
        private const string IModelWriteMethodName = $"{nameof(IPersistableModel<object>.Write)}Core";
        private const string IModelCreateMethodName = $"{nameof(IPersistableModel<object>.Create)}Core";
        private readonly CSharpType _privateAdditionalRawDataPropertyType = typeof(IDictionary<string, BinaryData>);
        private readonly CSharpType _iJsonModelTInterface;
        private readonly CSharpType? _iJsonModelObjectInterface;
        private readonly CSharpType _iPersistableModelTInterface;
        private readonly CSharpType? _iPersistableModelObjectInterface;
        private ModelProvider _model;
        private InputModelType _inputModel;
        private readonly FieldProvider? _rawDataField;
        private readonly bool _isStruct;
        private MethodProvider? _serializationConstructor;
        private PropertySerializationProvider[]? _propertySerializations;

        public MrwSerializationTypeProvider(ModelProvider model, InputModelType inputModel)
        {
            _model = model;
            _inputModel = inputModel;
            _isStruct = model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            // Initialize the serialization interfaces
            _iJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), model.Type);
            _iJsonModelObjectInterface = _isStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _iPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), model.Type);
            _iPersistableModelObjectInterface = _isStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            _rawDataField = BuildRawDataField();

            Name = model.Name;
            Namespace = model.Namespace;
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _model.DeclarationModifiers;

        private MethodProvider SerializationConstructor => _serializationConstructor ??= BuildSerializationConstructor();
        private PropertySerializationProvider[] PropertySerializations => _propertySerializations ??= BuildPropertySerializations();

        public override string Name { get; }
        public override string Namespace { get; }

        /// <summary>
        /// Builds the fields for the model by adding the raw data field for serialization.
        /// </summary>
        /// <returns>The list of <see cref="FieldProvider"/> for the model.</returns>
        protected override FieldProvider[] BuildFields()
        {
            return _rawDataField != null ? [_rawDataField] : Array.Empty<FieldProvider>();
        }

        protected override MethodProvider[] BuildConstructors()
        {
            List<MethodProvider> constructors = new List<MethodProvider>();
            bool serializationCtorParamsMatch = false;
            bool ctorWithNoParamsExist = false;

            foreach (var ctor in _model.Constructors)
            {
                var initializationCtorParams = ctor.Signature.Parameters;

                // Check if the model constructor has no parameters
                if (!ctorWithNoParamsExist && !initializationCtorParams.Any())
                {
                    ctorWithNoParamsExist = true;
                }

                if (!serializationCtorParamsMatch)
                {
                    // Check if the model constructor parameters match the serialization constructor parameters
                    if (initializationCtorParams.SequenceEqual(SerializationConstructor.Signature.Parameters))
                    {
                        serializationCtorParamsMatch = true;
                    }
                }
            }

            // Add the serialization constructor if it doesn't match any of the existing constructors
            if (!serializationCtorParamsMatch)
            {
                constructors.Add(SerializationConstructor);
            }

            // Add an empty constructor if the model doesn't have one
            if (!ctorWithNoParamsExist)
            {
                constructors.Add(BuildEmptyConstructor());
            }

            return constructors.ToArray();
        }

        /// <summary>
        /// Builds the raw data field for the model to be used for serialization.
        /// </summary>
        /// <returns>The constructed <see cref="FieldProvider"/> if the model should generate the field.</returns>
        private FieldProvider? BuildRawDataField()
        {
            if (_isStruct)
            {
                return null;
            }

            var FieldProvider = new FieldProvider(
                modifiers: FieldModifiers.Private,
                type: _privateAdditionalRawDataPropertyType,
                name: PrivateAdditionalRawDataPropertyName);

            return FieldProvider;
        }

        private PropertySerializationProvider[] BuildPropertySerializations()
        {
            var propertyCount = _inputModel.Properties.Count;
            PropertySerializationProvider[] propertySerializations = new PropertySerializationProvider[propertyCount];
            for (var i = 0; i < propertyCount; i++)
            {
                var property = _inputModel.Properties[i];
                propertySerializations[i] = new PropertySerializationProvider(property);
            }

            return propertySerializations;
        }

        /// <summary>
        /// Builds the serialization methods for the model.
        /// </summary>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();
            // Add JSON serialization method declarations in the case that the model doesn't inherit from another model.
            // Generated methods will invoke the core write and create methods ie.
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => WriteCore(writer, options);
            // In the case that the model inherits from another model, the generated core methods will override the base methods.
            if (_model.Inherits == null)
            {
                methods.Add(BuildJsonModelWriteMethodDeclaration());
                methods.Add(BuildJsonModelCreateMethodDeclaration());
                methods.Add(BuildIModelWriteMethodDeclaration());
                methods.Add(BuildIModelCreateMethodDeclaration());
            }

            // Add JSON serialization methods
            methods.Add(BuildJsonModelWriteMethod());
            methods.Add(BuildJsonModelCreateMethod());
            // Add Deserialization method
            methods.Add(BuildDeserializationMethod());
            // Add IModel methods
            methods.Add(BuildIModelWriteMethod());
            methods.Add(BuildIModelCreateMethod());
            methods.Add(BuildIModelGetFormatFromOptionsMethod());
            methods.Add(BuildFromOperationResponseMethod());
            methods.Add(BuildToBinaryContentMethod());

            return methods.ToArray();
        }

        /// <summary>
        /// Builds the types that the model type serialization implements.
        /// </summary>
        /// <returns>An array of <see cref="CSharpType"/> types that the model implements.</returns>
        protected override CSharpType[] BuildImplements()
        {
            int interfaceCount = _iJsonModelObjectInterface != null ? 2 : 1;
            CSharpType[] interfaces = new CSharpType[interfaceCount];
            interfaces[0] = _iJsonModelTInterface;

            if (_iJsonModelObjectInterface != null)
            {
                interfaces[1] = _iJsonModelObjectInterface;
            }

            return interfaces;
        }

        /// <summary>
        /// Builds the JSON serialization write method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelWriteMethod()
        {
            ParameterProvider utf8JsonWriterParameter = new("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (ShouldOverrideMethod())
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }
            // void WriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(JsonModelWriteMethodName, null, null, modifiers, null, null, [utf8JsonWriterParameter, _serializationOptionsParameter]),
              BuildJsonModelWriteMethodBody(utf8JsonWriterParameter),
              this
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateMethod()
        {
            ParameterProvider utf8JsonReaderParameter = new("reader", $"The JSON reader.", typeof(Utf8JsonReader), isRef: true);
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (ShouldOverrideMethod())
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }
            var typeOfT = GetModelArgumentType(_iJsonModelTInterface);
            // T CreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(JsonModelCreateMethodName, null, null, modifiers, typeOfT, null, [utf8JsonReaderParameter, _serializationOptionsParameter]),
              BuildJsonModelCreateMethodBody(utf8JsonReaderParameter, typeOfT),
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
            var jsonElementParam = new ParameterProvider("element", $"The JSON element to deserialize", typeof(JsonElement));
            // T DeserializeT(JsonElement element, ModelReaderWriterOptions options = null)
            return new MethodProvider
            (
              new MethodSignature(methodName, null, null, signatureModifiers, _model.Type, null, [jsonElementParam, _mrwDeserializationOptionsParameter]),
              BuildDeserializationMethodBody(new JsonElementSnippet(jsonElementParam)),
              this
            );
        }

        /// <summary>
        /// Builds the I model write method.
        /// </summary>
        internal MethodProvider BuildIModelWriteMethod()
        {
            var returnType = typeof(BinaryData);
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (ShouldOverrideMethod())
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            // BinaryData WriteCore(ModelReaderWriterOptions options)
            return new MethodProvider
            (
                new MethodSignature(IModelWriteMethodName, null, null, modifiers, returnType, null, [_serializationOptionsParameter]),
                BuildIModelWriteMethodBody(),
                this
            );
        }

        /// <summary>
        /// Builds the I model create method.
        /// </summary>
        internal MethodProvider BuildIModelCreateMethod()
        {
            ParameterProvider dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            if (ShouldOverrideMethod())
            {
                modifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            }

            // protected virtual T CreateCore(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iPersistableModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(IModelCreateMethodName, null, null, modifiers, typeOfT, null, [dataParameter, _serializationOptionsParameter]),
              BuildIModelCreateMethodBody(dataParameter, typeOfT),
              this
            );
        }

        /// <summary>
        /// Builds the I model GetFormatFromOptions method.
        /// </summary>
        internal MethodProvider BuildIModelGetFormatFromOptionsMethod()
        {
            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, [_serializationOptionsParameter], ExplicitInterface: _iPersistableModelTInterface),
              ModelReaderWriterOptionsSnippet.JsonFormat,
              this
            );
        }

        /// <summary>
        /// Builds the FromResponse method.
        /// </summary>
        internal MethodProvider BuildFromOperationResponseMethod()
        {
            var methodName = "FromResponse";
            var result = new ParameterProvider("response", $"The result to deserialize the model from.", typeof(PipelineResponse));
            var signatureModifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static;
            return new MethodProvider
            (
                new MethodSignature(
                    methodName,
                    Summary: null,
                    $"Deserializes the model from a raw response.",
                    signatureModifiers,
                    _model.Type,
                    ReturnDescription: null,
                    [result]),
                new MethodBodyStatement[]
                {
                    UsingVar("document", JsonDocumentSnippet.Parse(new PipelineResponseSnippet(result).Content), out var document),
                    // DeserializeT(document.RootElement);
                    Return(TypeProviderSnippet.Deserialize(_model, document.RootElement))
                },
                this
            );
        }

        /// <summary>
        /// Builds the ToBinaryContent method.
        /// </summary>
        internal MethodProvider BuildToBinaryContentMethod()
        {
            var methodName = "ToBinaryContent";
            var signatureModifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Virtual;
            var requestContentType = typeof(BinaryContent);

            return new MethodProvider
            (
                new MethodSignature(
                    methodName,
                    Summary: null,
                    $"Convert into a {requestContentType:C}.",
                    signatureModifiers,
                    requestContentType,
                    ReturnDescription: null,
                    Array.Empty<ParameterProvider>()),
                new MethodBodyStatement[]
                {
                    Return(BinaryContentSnippet.Create(
                        This,
                        ModelReaderWriterOptionsSnippet.Wire,
                        _model.Type))
                },
                this
            );
        }

        /// <summary>
        /// Builds the serialization constructor for the model.
        /// </summary>
        /// <returns>The constructed serialization constructor.</returns>
        internal MethodProvider BuildSerializationConstructor()
        {
            var serializationCtorParameters = BuildSerializationConstructorParameters();

            return new MethodProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    MethodSignatureModifiers.Internal,
                    serializationCtorParameters),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(serializationCtorParameters)
                },
                this);
        }

        /// <summary>
        /// Builds the JSON serialization write method declaration for the model. This method is used to
        /// invoke the core write method for the model.
        /// </summary>
        private MethodProvider BuildJsonModelWriteMethodDeclaration()
        {
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => WriteCore(writer, options);
            ParameterProvider utf8JsonWriterParameter = new("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, [utf8JsonWriterParameter, _serializationOptionsParameter], ExplicitInterface: _iJsonModelTInterface),
              new InvokeInstanceMethodExpression(null, JsonModelWriteMethodName, [utf8JsonWriterParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method declaration for the model. This method is used to
        /// invoke the core create method for the model.
        /// </summary>
        private MethodProvider BuildJsonModelCreateMethodDeclaration()
        {
            // Friend IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => CreateCore(ref reader, options);
            ParameterProvider utf8JsonReaderParameter = new("reader", $"The JSON reader.", typeof(Utf8JsonReader), isRef: true);
            var typeOfT = GetModelArgumentType(_iJsonModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, [utf8JsonReaderParameter, _serializationOptionsParameter], ExplicitInterface: _iJsonModelTInterface),
              new InvokeInstanceMethodExpression(null, JsonModelCreateMethodName, [utf8JsonReaderParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the IModel serialization write method declaration for the model. This method is used to
        /// invoke the core write method for the model.
        /// </summary>
        private MethodProvider BuildIModelWriteMethodDeclaration()
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options) => WriteCore(options);
            var returnType = typeof(BinaryData);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, returnType, null, [_serializationOptionsParameter], ExplicitInterface: _iPersistableModelTInterface),
                new InvokeInstanceMethodExpression(null, IModelWriteMethodName, [_serializationOptionsParameter]),
                this
            );
        }

        /// <summary>
        /// Builds the IModel serialization create method declaration for the model. This method is used to
        /// invoke the core create method for the model.
        /// </summary>
        private MethodProvider BuildIModelCreateMethodDeclaration()
        {
            ParameterProvider dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
            var typeOfT = GetModelArgumentType(_iPersistableModelTInterface);
            // T IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options) => CreateCore(data, options);
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, [dataParameter, _serializationOptionsParameter], ExplicitInterface: _iPersistableModelTInterface),
              new InvokeInstanceMethodExpression(null, IModelCreateMethodName, [dataParameter, _serializationOptionsParameter]),
              this
            );
        }

        /// <summary>
        /// Builds the method body for the JsonModelWrite method.
        /// </summary>
        /// <param name="utf8JsonWriterParameter">The Utf8JsonWriter parameter.</param>
        /// <returns>An array of MethodBodyStatement representing the method body.</returns>
        private MethodBodyStatement[] BuildJsonModelWriteMethodBody(ParameterProvider utf8JsonWriterParameter)
        {
            var options = new ModelReaderWriterOptionsSnippet(_serializationOptionsParameter);
            var writer = new Utf8JsonWriterSnippet(utf8JsonWriterParameter);
            return
            [
                CreateValidateJsonFormat(options, _iPersistableModelTInterface, SerializationFormatValidationType.Write),
                writer.WriteStartObject(),
                CreateWritePropertiesStatements(writer, options),
                CreateWriteAdditionalRawDataStatement(writer, options) ?? EmptyStatement,
                writer.WriteEndObject(),
            ];
        }

        private MethodBodyStatement[] BuildJsonModelCreateMethodBody(ParameterProvider utf8JsonReader, CSharpType typeOfT)
        {
            var options = new ModelReaderWriterOptionsSnippet(_serializationOptionsParameter);
            return
            [
                 CreateValidateJsonFormat(options, _iPersistableModelTInterface, SerializationFormatValidationType.Read),
                 // using var document = JsonDocument.ParseValue(ref reader);
                 UsingDeclare("document", JsonDocumentSnippet.ParseValue(utf8JsonReader), out var docVariable),
                  // return DeserializeT(doc.RootElement, options);
                 Return(TypeProviderSnippet.Deserialize(_model, docVariable.RootElement, options))
            ];
        }

        private MethodBodyStatement[] BuildDeserializationMethodBody(JsonElementSnippet jsonElementSnippet)
        {
            var (rawDataDeclarations, additionalRawDataDictionary, rawDataDictionary, assignRawData) = CreateRawDataVariableDeclarationStatements();
            var serializationCtorParameters = BuildSerializationConstructorParameters(additionalRawDataDictionary);

            return
            [
                // options ??= new ModelReaderWriterOptions("W");
                AssignIfNull(ModelReaderWriterOptionsSnippet.MrwNullableOptions(_mrwDeserializationOptionsParameter), ModelReaderWriterOptionsSnippet.Wire),
                EmptyLineStatement,
                GetValueKindEqualsNullCheck(jsonElementSnippet),
                GetPropertyVariableDeclarations(),
                rawDataDeclarations ?? EmptyStatement,
                BuildDeserializePropertiesForEachStatement(jsonElementSnippet, rawDataDictionary, additionalRawDataDictionary),
                assignRawData ?? EmptyStatement,
                Return(New.Instance(_model.Type, serializationCtorParameters))
            ];
        }

        private IfStatement GetValueKindEqualsNullCheck(JsonElementSnippet jsonElementSnippet)
        {
            return new IfStatement(jsonElementSnippet.ValueKindEqualsNull())
            {
                Return(Null)
            };
        }

        private MethodBodyStatement[] GetPropertyVariableDeclarations()
        {
            var propertyCount = PropertySerializations.Length;
            MethodBodyStatement[] propsDeclarations = new MethodBodyStatement[propertyCount];
            for (var i = 0; i < propertyCount; i++)
            {
                propsDeclarations[i] = Declare(PropertySerializations[i].VariableReference, Default);
            }
            return propsDeclarations;
        }

        private (
            MethodBodyStatement[]? RawDataDeclarations,
            TypedSnippet? AdditionalRawDataDictionary,
            DictionarySnippet? RawDataDictionary,
            AssignValueStatement? AssignRawData) CreateRawDataVariableDeclarationStatements()
        {
            if (_rawDataField != null)
            {
                var rawDataType = new CSharpType(typeof(Dictionary<string, BinaryData>));
                TypedSnippet? additionalRawDataDictionary;
                DictionarySnippet? rawDataDictionary;
                MethodBodyStatement[] rawDataDeclarations =
                [
                    // IDictionary<string, BinaryData> serializedAdditionalRawData = default;
                    Declare(
                        _privateAdditionalRawDataPropertyType,
                        AdditionalRawDataVarName,
                        new DictionarySnippet(_privateAdditionalRawDataPropertyType.Arguments[0], _privateAdditionalRawDataPropertyType.Arguments[1], Default),
                        out additionalRawDataDictionary),
                     // Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>()
                    Declare(
                        "rawDataDictionary",
                        new DictionarySnippet(rawDataType.Arguments[0], rawDataType.Arguments[1],
                        New.Instance(rawDataType)),
                        out rawDataDictionary)
                ];
                var assignRawData = Assign(additionalRawDataDictionary, rawDataDictionary);
                return (rawDataDeclarations, additionalRawDataDictionary, rawDataDictionary, assignRawData);
            }

            return (null, null, null, null);
        }

        private ValueExpression[] BuildSerializationConstructorParameters(TypedSnippet? additionalRawDataDictionary)
        {
            // Map property variable names to their corresponding serialization parameters
            var serializationCtorParameterValues = new Dictionary<string, ValueExpression>(PropertySerializations.Length);

            foreach (var kv in PropertySerializations)
            {
                serializationCtorParameterValues[kv.VariableName] = GetOptionalParameterValue(kv, kv.VariableReference);
            }

            if (additionalRawDataDictionary != null)
            {
                // add the additional raw data to the list of parameters
                serializationCtorParameterValues.Add(AdditionalRawDataVarName, additionalRawDataDictionary);
            }

            var serializationCtorParametersCount = SerializationConstructor.Signature.Parameters.Count;
            ValueExpression[] serializationCtorParameters = new ValueExpression[serializationCtorParametersCount];

            for (var i = 0; i < serializationCtorParametersCount; i++)
            {
                var parameter = SerializationConstructor.Signature.Parameters[i];
                if (serializationCtorParameterValues.TryGetValue(parameter.Name, out var value))
                {
                    serializationCtorParameters[i] = value;
                }
                else
                {
                    serializationCtorParameters[i] = Default;
                }
            }

            return serializationCtorParameters;
        }

        private ValueExpression GetOptionalParameterValue(PropertySerializationProvider jsonPropertySerialization, TypedSnippet variable)
        {
            var sourceType = variable.Type;
            if (!sourceType.IsFrameworkType || jsonPropertySerialization.VariableName == "serializedAdditionalRawData")
            {
                return variable;
            }
            else if (!jsonPropertySerialization.IsRequired)
            {
                return Optional.FallBackToChangeTrackingCollection(variable, jsonPropertySerialization.Type);
            }

            return variable;
        }

        private ForeachStatement BuildDeserializePropertiesForEachStatement(
            JsonElementSnippet jsonElementSnippet,
            DictionarySnippet? rawDataDictionary,
            TypedSnippet? additionalRawDataDictionary)
        {
            var foreachStatement = new ForeachStatement("prop", jsonElementSnippet.EnumerateObject(), out var prop)
            {
                BuildDeserializePropertiesStatements(new JsonPropertySnippet(prop), rawDataDictionary, additionalRawDataDictionary)
            };

            return foreachStatement;
        }

        private List<MethodBodyStatement> BuildDeserializePropertiesStatements(
            JsonPropertySnippet jsonPropertySnippet,
            DictionarySnippet? rawDataDictionary,
            TypedSnippet? additionalRawDataDictionary)
        {
            List<MethodBodyStatement> propertyDeserializationStatements = new();
            // Create each property's deserialization statement
            for (var i = 0; i < PropertySerializations.Length; i++)
            {
                var checkIfJsonPropEqualsName = new IfStatement(jsonPropertySnippet.NameEquals(PropertySerializations[i].SerializedName))
                {
                    DeserializeProperty(PropertySerializations[i], jsonPropertySnippet)
                };
                propertyDeserializationStatements.Add(checkIfJsonPropEqualsName);
            }

            // deserialize the raw data properties
            if (rawDataDictionary != null && additionalRawDataDictionary != null)
            {
                propertyDeserializationStatements.Add(DeserializeRawDataStatement(jsonPropertySnippet, rawDataDictionary));
            }

            return propertyDeserializationStatements;
        }

        private IfStatement DeserializeRawDataStatement(JsonPropertySnippet jsonPropertySnippet, DictionarySnippet rawDataDictionary)
        {
            var elementType = _privateAdditionalRawDataPropertyType.Arguments[1].FrameworkType;
            var rawDataDeserializationValue = GetFrameworkTypeValueExpression(elementType, jsonPropertySnippet.Value, SerializationFormat.Default);
            var format = ModelReaderWriterOptionsSnippet.MrwNullableOptions(_mrwDeserializationOptionsParameter).Format;
            return WrapInCheckNotWireIfStatement(format, rawDataDictionary.Add(jsonPropertySnippet.Name, rawDataDeserializationValue));
        }

        private List<MethodBodyStatement> DeserializeProperty(
            PropertySerializationProvider propertySerializationProvider,
            JsonPropertySnippet jsonProperty)
        {
            var statements = new List<MethodBodyStatement>();
            var propertyNullCheck = DeserializationPropertyNullCheckStatement(propertySerializationProvider, jsonProperty);
            if (propertyNullCheck != null)
            {
                statements.Add(propertyNullCheck);
            }

            var deserializeValue = DeserializeValue(propertySerializationProvider.Type, jsonProperty.Value, propertySerializationProvider.SerializationFormat, out ValueExpression value);
            statements.Add(deserializeValue);

            statements.Add(Assign(propertySerializationProvider.VariableReference, value));
            statements.Add(Continue);

            return statements;
        }

        /// <summary>
        /// This method constructs the deserialization property null check statement for the json property
        /// <paramref name="jsonProperty"/>. If the property is required, the method will return a null check
        /// with an assignment to the property variable. If the property is not required, the method will simply
        /// return a null check for the json property.
        /// </summary>
        private IfStatement? DeserializationPropertyNullCheckStatement(
            PropertySerializationProvider propertySerializationProvider,
            JsonPropertySnippet jsonProperty)
        {
            // Produces: if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            var checkEmptyProperty = jsonProperty.Value.ValueKindEqualsNull();
            CSharpType serializedType = propertySerializationProvider.Type;

            if (serializedType.IsNullable)
            {
                if (!serializedType.IsCollection)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        Assign(propertySerializationProvider.VariableReference, Null),
                        Continue
                    };
                }

                if (propertySerializationProvider.IsRequired && !serializedType.IsValueType)
                {
                    return new IfStatement(checkEmptyProperty)
                    {
                        Assign(propertySerializationProvider.VariableReference, New.Instance(serializedType.PropertyInitializationType)),
                        Continue
                    };
                }

                return new IfStatement(checkEmptyProperty) { Continue };
            }

            if ((propertySerializationProvider.IsRequired && !serializedType.IsReadOnlyMemory)
                || serializedType.Equals(typeof(JsonElement))
                || serializedType.Equals(typeof(string)))
            {
                return null;
            }

            return new IfStatement(checkEmptyProperty) { Continue };
        }

        private MethodBodyStatement DeserializeValue(
            CSharpType valueType,
            JsonElementSnippet jsonElement,
            SerializationFormat serializationFormat,
            out ValueExpression value)
        {
            if (valueType.IsList || valueType.IsArray)
            {
                // Handle read-only memory arrays
                if (valueType.IsArray && valueType.ElementType.IsReadOnlyMemory)
                {
                    return CreateDeserializeReadOnlyMemoryArrayStatements(valueType, jsonElement, serializationFormat, out value);
                }

                return CreateDeserializeListOrArrayStatements(valueType, jsonElement, serializationFormat, out value);
            }
            else if (valueType.IsDictionary)
            {
                return CreateDeserializeDictionaryStatements(valueType, jsonElement, serializationFormat, out value);
            }
            else
            {
                value = CreateDeserializeValueExpression(valueType, serializationFormat, jsonElement);
                return EmptyStatement;
            }
        }

        private MethodBodyStatement[] CreateDeserializeReadOnlyMemoryArrayStatements(
            CSharpType valueType,
            JsonElementSnippet jsonElement,
            SerializationFormat serializationFormat,
            out ValueExpression arrayInstance)
        {
            var array = new VariableReferenceSnippet(valueType.ElementType.PropertyInitializationType, "array");
            var index = new VariableReferenceSnippet(typeof(int), "index");
            var deserializeReadOnlyMemory = new MethodBodyStatement[]
            {
                Declare(index, Int(0)),
                Declare(array, New.Array(valueType.ElementType, jsonElement.GetArrayLength())),
                new ForeachStatement("item", jsonElement.EnumerateArray(), out var item)
                {
                    CreateDeserializeArrayItemIntoArrayStatement(valueType.ElementType, new ArrayElementExpression(array, index), new JsonElementSnippet(item), serializationFormat),
                    Increment(index)
                }
            };
            arrayInstance = New.Instance(valueType.ElementType, array);
            return deserializeReadOnlyMemory;
        }

        private MethodBodyStatement[] CreateDeserializeListOrArrayStatements(
            CSharpType valueType,
            JsonElementSnippet jsonElement,
            SerializationFormat serializationFormat,
            out ValueExpression listVar)
        {
            var deserializeArrayStatement = new MethodBodyStatement[]
            {
                Declare("array", New.List(valueType.ElementType), out var listVariable),
                new ForeachStatement("item", jsonElement.EnumerateArray(), out var arrayItem)
                {
                   CreateDeserializeArrayItemIntoListStatement(valueType.ElementType, listVariable, new JsonElementSnippet(arrayItem), serializationFormat)
                }
            };
            listVar = listVariable;
            return deserializeArrayStatement;
        }

        private MethodBodyStatement[] CreateDeserializeDictionaryStatements(
            CSharpType valueType,
            JsonElementSnippet jsonElement,
            SerializationFormat serializationFormat,
            out ValueExpression value)
        {
            var deserializeDictionaryStatement = new MethodBodyStatement[]
            {
                Declare("dictionary", New.Dictionary(valueType.Arguments[0], valueType.Arguments[1]), out var dictionary),
                new ForeachStatement("prop", jsonElement.EnumerateObject(), out var prop)
                {
                   CreateDeserializeDictionaryValueStatement(valueType.ElementType, dictionary, new JsonPropertySnippet(prop), serializationFormat)
                }
            };
            value = dictionary;
            return deserializeDictionaryStatement;
        }

        private ValueExpression CreateDeserializeValueExpression(CSharpType valueType, SerializationFormat serializationFormat, JsonElementSnippet jsonElement)
        {
            if (valueType.SerializeAs != null)
            {
                return new CastExpression(GetFrameworkTypeValueExpression(valueType.SerializeAs, jsonElement, serializationFormat), valueType);
            }
            else if (valueType.IsFrameworkType)
            {
                var frameworkType = valueType.FrameworkType;
                if (frameworkType == typeof(Nullable<>))
                {
                    frameworkType = valueType.Arguments[0].FrameworkType;
                }

                return GetFrameworkTypeValueExpression(frameworkType, jsonElement, serializationFormat);
            }

            // Deserialize providers
            var providerDeserialization = CreateDeserializeValueExpressionForProvider(valueType.Implementation, jsonElement);
            return providerDeserialization ?? throw new InvalidOperationException($"Unable to deserialize type {valueType}");
        }

        private ValueExpression? CreateDeserializeValueExpressionForProvider(TypeProvider implementation, JsonElementSnippet jsonElement)
        {
            if (implementation is EnumProvider enumProvider)
            {
                var value = GetFrameworkTypeValueExpression(enumProvider.ValueType.FrameworkType, jsonElement, SerializationFormat.Default);
                return enumProvider.ToEnum(value);
            }
            else if (implementation is ModelProvider modelProvider)
            {
                var methodArgs = new ValueExpression[]
                {
                    jsonElement,
                    ModelReaderWriterOptionsSnippet.MrwNullableOptions(_mrwDeserializationOptionsParameter)
                };
                return new InvokeStaticMethodExpression(modelProvider.Type, $"Deserialize{modelProvider.Name}", methodArgs);
            }

            return null;
        }

        private MethodBodyStatement CreateDeserializeArrayItemIntoListStatement(
            CSharpType arrayItemType,
            ListSnippet listVar,
            JsonElementSnippet arrayItemVar,
            SerializationFormat serializationFormat)
        =>
            NullCheckCollectionItemIfRequired(arrayItemType, arrayItemVar, listVar.Add(Null), new MethodBodyStatement[]
            {
                DeserializeValue(arrayItemType, arrayItemVar, serializationFormat, out ValueExpression value),
                listVar.Add(value),
            });

        private MethodBodyStatement CreateDeserializeArrayItemIntoArrayStatement(
            CSharpType arrayItemType,
            ArrayElementExpression arrayElement,
            JsonElementSnippet arrayItemVar,
            SerializationFormat serializationFormat)
        =>
            NullCheckCollectionItemIfRequired(arrayItemType, arrayItemVar, Assign(arrayElement, Null), new MethodBodyStatement[]
            {
                DeserializeValue(arrayItemType, arrayItemVar, serializationFormat, out ValueExpression value),
                Assign(arrayElement, value),
            });

        private MethodBodyStatement CreateDeserializeDictionaryValueStatement(
            CSharpType dictionaryItemType,
            DictionarySnippet dictionary,
            JsonPropertySnippet property,
            SerializationFormat serializationFormat)
        {
            var deserializeValueBlock = new MethodBodyStatement[]
            {
                DeserializeValue(dictionaryItemType, property.Value, serializationFormat, out var value),
                dictionary.Add(property.Name, value)
            };

            if (TypeRequiresNullCheckInSerialization(dictionaryItemType))
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

        private MethodBodyStatement NullCheckCollectionItemIfRequired(
            CSharpType collectionItemType,
            JsonElementSnippet arrayItemVar,
            MethodBodyStatement assignNull,
            MethodBodyStatement deserializeValue)
            => TypeRequiresNullCheckInSerialization(collectionItemType)
                ? new IfElseStatement(arrayItemVar.ValueKindEqualsNull(), assignNull, deserializeValue)
                : deserializeValue;

        private MethodBodyStatement[] BuildIModelWriteMethodBody()
        {
            var options = new ModelReaderWriterOptionsSnippet(_serializationOptionsParameter);
            return
            [
                GetConcreteFormat(options, _iPersistableModelTInterface, out TypedSnippet format),
                BuildIModelWriteSwitchCase(format, options),
            ];
        }

        private SwitchStatement BuildIModelWriteSwitchCase(TypedSnippet format, ModelReaderWriterOptionsSnippet options)
        {
            var switchCase = new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippet.JsonFormat,
                Return(new InvokeStaticMethodExpression(typeof(ModelReaderWriter), nameof(ModelReaderWriter.Write), [This, options])));

            // default case
            var typeOfT = _iPersistableModelTInterface.Arguments[0];
            var defaultCase = SwitchCaseStatement.Default(
                ThrowValidationFailException(options.Format, typeOfT, SerializationFormatValidationType.Write));
            return new SwitchStatement(format, [switchCase, defaultCase]);
        }

        private MethodBodyStatement[] BuildIModelCreateMethodBody(ParameterProvider dataParam, CSharpType typeOfT)
        {
            var options = new ModelReaderWriterOptionsSnippet(_serializationOptionsParameter);
            return
            [
                 GetConcreteFormat(options, _iPersistableModelTInterface, out TypedSnippet format),
                 BuildIModelCreateSwitchCase(format, dataParam, typeOfT, options),
            ];
        }

        private SwitchStatement BuildIModelCreateSwitchCase(
            TypedSnippet format,
            ParameterProvider dataParam,
            CSharpType typeOfT,
            ModelReaderWriterOptionsSnippet options)
        {
            var data = new BinaryDataSnippet(dataParam);
            var switchCase = new SwitchCaseStatement(
                ModelReaderWriterOptionsSnippet.JsonFormat,
                new MethodBodyStatement[]
                {
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentSnippet.Parse(data), out var jsonDocumentVar)
                    {
                        Return(TypeProviderSnippet.Deserialize(_model, new JsonDocumentSnippet(jsonDocumentVar).RootElement, options))
                    },
                });

            // default case
            var defaultCase = SwitchCaseStatement.Default(
                ThrowValidationFailException(options.Format, typeOfT, SerializationFormatValidationType.Read));
            return new SwitchStatement(format, [switchCase, defaultCase]);
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<ParameterProvider> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            foreach (var param in parameters)
            {
                if (param.Name == _rawDataField?.Name.ToVariableName())
                {
                    methodBodyStatements.Add(Assign(new MemberExpression(null, _rawDataField.Name), new ParameterReferenceSnippet(param)));
                    continue;
                }

                ValueExpression initializationValue = new ParameterReferenceSnippet(param);
                var initializationStatement = Assign(new MemberExpression(null, param.Name.FirstCharToUpperCase()), initializationValue);
                if (initializationStatement != null)
                {
                    methodBodyStatements.Add(initializationStatement);
                }
            }

            return methodBodyStatements;
        }

        /// <summary>
        /// Produces the validation body statements for the JSON serialization format.
        /// </summary>
        private MethodBodyStatement CreateValidateJsonFormat(ModelReaderWriterOptionsSnippet options, CSharpType iModelTInterface, SerializationFormatValidationType validationType)
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
                GetConcreteFormat(options, iModelTInterface, out TypedSnippet format),
                new IfStatement(NotEqual(format, ModelReaderWriterOptionsSnippet.JsonFormat))
                {
                    ThrowValidationFailException(format, iModelTInterface.Arguments[0], validationType)
                },
                EmptyStatement
            ];

            return statements;
        }

        private MethodBodyStatement GetConcreteFormat(ModelReaderWriterOptionsSnippet options, CSharpType iModelTInterface, out TypedSnippet format)
        {
            var castSnippet = new StringSnippet(This.CastTo(iModelTInterface).Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), options));
            var condition = new TernaryConditionalExpression(
                Equal(options.Format, ModelReaderWriterOptionsSnippet.WireFormat),
                castSnippet,
                options.Format);
            var reference = new VariableReferenceSnippet(castSnippet.Type, "format");
            format = reference;
            return Var(reference, condition);
        }

        /// <summary>
        /// Creates a <see cref="KeywordStatement"/> of type <see cref="FormatException"/> with a specific message indicating
        /// that the model does not support the specified serialization format.
        /// </summary>
        /// <param name="format">The serialization format.</param>
        /// <param name="typeOfT">The type of the model.</param>
        /// <param name="validationType">The type of validation (write or read).</param>
        /// <returns>The <see cref="MethodBodyStatement"/> representing the throw statement.</returns>
        private KeywordStatement ThrowValidationFailException(ValueExpression format, CSharpType typeOfT, SerializationFormatValidationType validationType)
            => Throw(New.Instance(
                typeof(FormatException),
                new FormattableStringExpression($"The model {{{0}}} does not support {(validationType == SerializationFormatValidationType.Write ? "writing" : "reading")} '{{{1}}}' format.",
                [
                    Nameof(typeOfT),
                    format
                ])));

        /// <summary>
        /// Constructs the body statements containing the serialization statements for the model properties.
        /// </summary>
        /// <param name="utf8JsonWriter">The Utf8JsonWriter to write the properties to.</param>
        /// <param name="options">The model reader/writer options.</param>
        private MethodBodyStatement[] CreateWritePropertiesStatements(Utf8JsonWriterSnippet utf8JsonWriter, ModelReaderWriterOptionsSnippet options)
        {
            var propertyCount = PropertySerializations.Length;
            var propertyStatements = new MethodBodyStatement[propertyCount];
            for (var i = 0; i < propertyCount; i++)
            {
                var inputProperty = _inputModel.Properties[i];
                var propertyMember = new MemberExpression(null, PropertySerializations[i].Name);

                // Generate the serialization statements for the property
                var writePropertySerializationStatements = new MethodBodyStatement[]
                {
                    utf8JsonWriter.WritePropertyName(PropertySerializations[i].VariableName),
                    CreateSerializationStatement(utf8JsonWriter, PropertySerializations[i].Type, propertyMember, PropertySerializations[i].SerializationFormat, options)
                };

                // Wrap the serialization statement in a check for whether the property is defined
                var wrapInIsDefinedStatement = WrapInIsDefined(utf8JsonWriter, PropertySerializations[i], propertyMember, writePropertySerializationStatements);
                propertyStatements[i] = inputProperty.IsReadOnly ? WrapInCheckNotWireIfStatement(options.Format, wrapInIsDefinedStatement) : wrapInIsDefinedStatement;
            }

            return propertyStatements;
        }

        private MethodBodyStatement CheckPropertyIsInitialized(
            Utf8JsonWriterSnippet utf8JsonWriter,
            PropertySerializationProvider propertySerializationProvider,
            MemberExpression propertyMemberExpression,
            MethodBodyStatement writePropertySerializationStatements)
        {
            var propertyType = propertySerializationProvider.Type;
            BoolSnippet propertyIsInitialized;
            if (propertyType.IsCollection && !propertyType.IsReadOnlyMemory && propertySerializationProvider.IsRequired)
            {
                propertyIsInitialized = And(NotEqual(propertyMemberExpression, Null),
                    Optional.IsCollectionDefined(new StringSnippet(propertyMemberExpression)));
            }
            else
            {
                propertyIsInitialized = NotEqual(propertyMemberExpression, Null);
            }

            return new IfElseStatement(
                propertyIsInitialized,
                writePropertySerializationStatements,
                utf8JsonWriter.WriteNull(propertySerializationProvider.SerializedName));
        }

        /// <summary>
        /// Wraps the serialization statement in a condition check to ensure only initialized and required properties are serialized.
        /// </summary>
        /// <param name="utf8JsonWriter">The JSON writer to use for serialization.</param>
        /// <param name="propertySerializationProvider">Provides serialization settings for the property.</param>
        /// <param name="propertyMemberExpression">The expression representing the property to serialize.</param>
        /// <param name="writePropertySerializationStatement">The serialization statement to conditionally execute.</param>
        /// <returns>A method body statement that includes condition checks before serialization.</returns>
        private MethodBodyStatement WrapInIsDefined(
            Utf8JsonWriterSnippet utf8JsonWriter,
            PropertySerializationProvider propertySerializationProvider,
            MemberExpression propertyMemberExpression,
            MethodBodyStatement writePropertySerializationStatement)
        {
            var propertyType = propertySerializationProvider.Type;
            if (propertyType.IsNullable)
            {
                writePropertySerializationStatement = CheckPropertyIsInitialized(
                utf8JsonWriter,
                propertySerializationProvider,
                propertyMemberExpression,
                writePropertySerializationStatement);
            }

            // Directly return the statement if the property is required or a non-nullable value type that is not JsonElement
            if (IsRequiredOrNonNullableValueType(propertyType, propertySerializationProvider.IsRequired))
            {
                return writePropertySerializationStatement;
            }

            // Conditionally serialize based on whether the property is a collection or a single value
            return CreateConditionalSerializationStatement(propertyType, propertyMemberExpression, writePropertySerializationStatement);
        }

        private bool IsRequiredOrNonNullableValueType(CSharpType propertyType, bool isRequired)
            => isRequired || (!propertyType.IsNullable && propertyType.IsValueType && !propertyType.Equals(typeof(JsonElement)));

        private MethodBodyStatement CreateConditionalSerializationStatement(CSharpType propertyType, MemberExpression propertyMemberExpression, MethodBodyStatement writePropertySerializationStatement)
        {
            var condition = propertyType.IsCollection && !propertyType.IsReadOnlyMemory
                ? Optional.IsCollectionDefined(new StringSnippet(propertyMemberExpression))
                : Optional.IsDefined(new StringSnippet(propertyMemberExpression));

            return new IfStatement(condition) { writePropertySerializationStatement };
        }

        /// <summary>
        /// Builds the write statement for the additional raw data.
        /// </summary>
        /// <returns>The method body statement that writes the additional raw data.</returns>
        private IfStatement? CreateWriteAdditionalRawDataStatement(Utf8JsonWriterSnippet utf8JsonWriter, ModelReaderWriterOptionsSnippet options)
        {
            if (_rawDataField == null)
            {
                return null;
            }

            var rawDataMemberExp = new MemberExpression(null, _rawDataField.Name);
            var rawDataDictionaryExp = new DictionarySnippet(_rawDataField.Type.Arguments[0], _rawDataField.Type.Arguments[1], rawDataMemberExp);
            var forEachStatement = new ForeachStatement("item", rawDataDictionaryExp, out KeyValuePairSnippet item)
            {
                utf8JsonWriter.WritePropertyName(item.Key),
                CreateSerializationStatement(utf8JsonWriter, _rawDataField.Type.Arguments[1], item.Value, SerializationFormat.Default, options),
            };

            var ifNotEqualToNullStatement = new IfStatement(NotEqual(rawDataDictionaryExp, Null))
            {
                forEachStatement,
            };

            return WrapInCheckNotWireIfStatement(options.Format, ifNotEqualToNullStatement);
        }

        /// <summary>
        /// Adds a `format != "W"` around the statement <paramref name="statement"/>.
        /// If the statement is not an IfStatement, we just create an IfStatement and return.
        /// If the statement is an IfStatement, we could add the condition to its condition which should simplify the generated code.
        /// </summary>
        private IfStatement WrapInCheckNotWireIfStatement(ValueExpression format, MethodBodyStatement statement)
        {
            var isNotWireCondition = NotEqual(format, ModelReaderWriterOptionsSnippet.WireFormat);
            if (statement is IfStatement ifStatement)
            {
                var updatedCondition = And(isNotWireCondition, new BoolSnippet(ifStatement.Condition));
                IfStatement updatedIf = new(updatedCondition, ifStatement.Inline, ifStatement.AddBraces)
                {
                    ifStatement.Body
                };
                return updatedIf;
            }

            return new IfStatement(isNotWireCondition)
            {
                statement
            };
        }

        /// <summary>
        /// Creates a serialization statement for the specified type.
        /// </summary>
        /// <param name="utf8JsonWriter">The Utf8JsonWriter instance.</param>
        /// <param name="serializationType">The type being serialized.</param>
        /// <param name="value">The value to be serialized.</param>
        /// <param name="serializationFormat">The serialization format.</param>
        /// <param name="options">The model reader/writer options.</param>
        /// <returns>The serialization statement.</returns>
        /// <exception cref="NotSupportedException">Thrown when the serialization type is not supported.</exception>
        private MethodBodyStatement CreateSerializationStatement(
            Utf8JsonWriterSnippet utf8JsonWriter,
            CSharpType serializationType,
            ValueExpression value,
            SerializationFormat serializationFormat,
            ModelReaderWriterOptionsSnippet options)
        {
            MethodBodyStatement? serializationStatement = null;
            switch (serializationType)
            {
                case var dictionaryType when dictionaryType.IsDictionary:
                    serializationStatement = CreateDictionarySerializationStatement(
                        utf8JsonWriter,
                        new DictionarySnippet(dictionaryType.Arguments[0], dictionaryType.Arguments[1], value),
                        serializationFormat,
                        options);
                    break;
                case var listType when listType.IsList || listType.IsArray:
                    serializationStatement = CreateListSerializationStatement(
                        utf8JsonWriter,
                        GetEnumerableExpression(value, listType),
                        serializationFormat,
                        options);
                    break;
                case var valueType when !valueType.IsCollection:
                    serializationStatement = SerializeValue(utf8JsonWriter, serializationType, serializationFormat, value, options);
                    break;
            }

            return serializationStatement ?? throw new NotSupportedException($"Serialization of type {serializationType.Name} is not supported.");
        }

        private MethodBodyStatement CreateDictionarySerializationStatement(
            Utf8JsonWriterSnippet utf8JsonWriter,
            DictionarySnippet dictionary,
            SerializationFormat serializationFormat,
            ModelReaderWriterOptionsSnippet options)
        {
            return new[]
            {
                utf8JsonWriter.WriteStartObject(),
                new ForeachStatement("item", dictionary, out KeyValuePairSnippet keyValuePair)
                {
                    utf8JsonWriter.WritePropertyName(keyValuePair.Key),
                    TypeRequiresNullCheckInSerialization(keyValuePair.ValueType) ?
                    new IfStatement(Equal(keyValuePair.Value, Null)) { utf8JsonWriter.WriteNullValue(), Continue } : EmptyStatement,
                    CreateSerializationStatement(utf8JsonWriter, keyValuePair.ValueType, keyValuePair.Value, serializationFormat, options)
                },
                utf8JsonWriter.WriteEndObject()
            };
        }

        private MethodBodyStatement CreateListSerializationStatement(
            Utf8JsonWriterSnippet utf8JsonWriter,
            EnumerableSnippet array,
            SerializationFormat serializationFormat,
            ModelReaderWriterOptionsSnippet options)
        {
            return new[]
            {
                utf8JsonWriter.WriteStartArray(),
                new ForeachStatement("item", array, out TypedSnippet item)
                {
                    TypeRequiresNullCheckInSerialization(item.Type) ?
                    new IfStatement(Equal(item, Null)) { utf8JsonWriter.WriteNullValue(), Continue } : EmptyStatement,
                    CreateSerializationStatement(utf8JsonWriter, item.Type, item, serializationFormat, options)
                },
                utf8JsonWriter.WriteEndArray()
            };
        }

        private MethodBodyStatement? SerializeValue(
            Utf8JsonWriterSnippet utf8JsonWriter,
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value,
            ModelReaderWriterOptionsSnippet options)
        {
            return type switch
            {
                { SerializeAs: not null } or { IsFrameworkType: true } =>
                    SerializeFrameworkTypeValue(utf8JsonWriter, type, serializationFormat, value, type.SerializeAs ?? type.FrameworkType, options),
                { Implementation: EnumProvider enumProvider } =>
                    SerializeEnumProvider(utf8JsonWriter, enumProvider, type, value),
                { Implementation: ModelProvider modelProvider } =>
                    utf8JsonWriter.WriteObjectValue(new TypeProviderSnippet(modelProvider, value), options: options),
                _ => null
            };
        }

        private MethodBodyStatement? SerializeEnumProvider(
            Utf8JsonWriterSnippet utf8JsonWriter,
            EnumProvider enumProvider,
            CSharpType type,
            ValueExpression value)
        {
            var enumerableSnippet = new EnumerableSnippet(type, value.NullableStructValue(type));
            if ((enumProvider.IsIntValueType && !enumProvider.IsExtensible) || enumProvider.IsNumericValueType)
            {
                return utf8JsonWriter.WriteNumberValue(enumProvider.ToSerial(enumerableSnippet));
            }
            else
            {
                return utf8JsonWriter.WriteStringValue(enumProvider.ToSerial(enumerableSnippet));
            }
        }

        private EnumerableSnippet GetEnumerableExpression(ValueExpression expression, CSharpType enumerableType)
        {
            CSharpType itemType = enumerableType.IsReadOnlyMemory ? new CSharpType(typeof(ReadOnlySpan<>), enumerableType.Arguments[0]) :
                enumerableType.ElementType;

            return new EnumerableSnippet(itemType, expression);
        }

        private MethodBodyStatement SerializeFrameworkTypeValue(
            Utf8JsonWriterSnippet utf8JsonWriter,
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value,
            Type valueType,
            ModelReaderWriterOptionsSnippet modelReaderWriterOptions)
        {
            if (valueType == typeof(JsonElement))
            {
                return new JsonElementSnippet(value).WriteTo(utf8JsonWriter);
            }

            if (valueType == typeof(Nullable<>))
            {
                valueType = type.Arguments[0].FrameworkType;
            }

            value = value.NullableStructValue(type);

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
                return utf8JsonWriter.WriteObjectValue(new FrameworkTypeSnippet(valueType, value), modelReaderWriterOptions);
            }

            if (valueType == typeof(string) || valueType == typeof(char) || valueType == typeof(Guid))
            {
                return utf8JsonWriter.WriteStringValue(value);
            }

            if (valueType == typeof(bool))
            {
                return utf8JsonWriter.WriteBooleanValue(value);
            }

            if (valueType == typeof(byte[]))
            {
                return utf8JsonWriter.WriteBase64StringValue(value, serializationFormat.ToFormatSpecifier());
            }

            if (valueType == typeof(DateTimeOffset) || valueType == typeof(DateTime) || valueType == typeof(TimeSpan))
            {
                var format = serializationFormat.ToFormatSpecifier();

                if (serializationFormat is SerializationFormat.Duration_Seconds)
                {
                    return utf8JsonWriter.WriteNumberValue(InvokeToInt32(new TimeSpanSnippet(value).InvokeToString(format)));
                }

                if (serializationFormat is SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double)
                {
                    return utf8JsonWriter.WriteNumberValue(InvokeToDouble(new TimeSpanSnippet(value).InvokeToString(format)));
                }

                if (serializationFormat is SerializationFormat.DateTime_Unix)
                {
                    return utf8JsonWriter.WriteNumberValue(value, format);
                }

                return format is not null
                    ? utf8JsonWriter.WriteStringValue(value, format)
                    : utf8JsonWriter.WriteStringValue(value);
            }

            if (valueType == typeof(IPAddress))
            {
                return utf8JsonWriter.WriteStringValue(value.InvokeToString());
            }

            if (valueType == typeof(Uri))
            {
                return utf8JsonWriter.WriteStringValue(new MemberExpression(value, nameof(Uri.AbsoluteUri)));
            }

            if (valueType == typeof(BinaryData))
            {
                var binaryDataValue = new BinaryDataSnippet(value);
                if (serializationFormat is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url)
                {
                    return utf8JsonWriter.WriteBase64StringValue(new BinaryDataSnippet(value).ToArray(), serializationFormat.ToFormatSpecifier());
                }

                return utf8JsonWriter.WriteBinaryData(binaryDataValue);
            }
            if (valueType == typeof(Stream))
            {
                return utf8JsonWriter.WriteBinaryData(BinaryDataSnippet.FromStream(value, false));
            }

            throw new NotSupportedException($"Framework type {valueType} serialization not supported.");
        }

        public static ValueExpression GetFrameworkTypeValueExpression(Type frameworkType, JsonElementSnippet element, SerializationFormat format)
        {
            if (frameworkType == typeof(Uri))
            {
                return New.Instance(frameworkType, element.GetString());
            }

            if (frameworkType == typeof(IPAddress))
            {
                return new InvokeStaticMethodExpression(typeof(IPAddress), nameof(IPAddress.Parse), element.GetString());
            }

            if (frameworkType == typeof(BinaryData))
            {
                return format is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                    ? BinaryDataSnippet.FromBytes(element.GetBytesFromBase64(format.ToFormatSpecifier()))
                    : BinaryDataSnippet.FromString(element.GetRawText());
            }

            if (frameworkType == typeof(Stream))
            {
                return new BinaryDataSnippet(BinaryDataSnippet.FromString(element.GetRawText())).ToStream();
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
                    ? DateTimeOffsetSnippet.FromUnixTimeSeconds(element.GetInt64())
                    : element.GetDateTimeOffset(format.ToFormatSpecifier());
            }

            if (frameworkType == typeof(DateTime))
                return element.GetDateTime();
            if (frameworkType == typeof(TimeSpan))
            {
                if (format is SerializationFormat.Duration_Seconds)
                {
                    return TimeSpanSnippet.FromSeconds(element.GetInt32());
                }

                if (format is SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double)
                {
                    return TimeSpanSnippet.FromSeconds(element.GetDouble());
                }

                return element.GetTimeSpan(format.ToFormatSpecifier());
            }

            throw new NotSupportedException($"Framework type {frameworkType} is not supported.");
        }

        /// <summary>
        /// Builds the parameters for the serialization constructor by iterating through the input model properties.
        /// It then adds raw data field to the constructor if it doesn't already exist in the list of constructed parameters.
        /// </summary>
        /// <returns>The list of parameters for the serialization parameter.</returns>
        private List<ParameterProvider> BuildSerializationConstructorParameters()
        {
            List<ParameterProvider> constructorParameters = new List<ParameterProvider>();
            bool shouldAddRawDataField = _rawDataField != null;

            foreach (var property in _inputModel.Properties)
            {
                var parameter = new ParameterProvider(property);
                constructorParameters.Add(parameter);

                if (shouldAddRawDataField && string.Equals(parameter.Name, _rawDataField?.Name, StringComparison.OrdinalIgnoreCase))
                {
                    shouldAddRawDataField = false;
                }
            }

            // Append the raw data field if it doesn't already exist in the constructor parameters
            if (shouldAddRawDataField && _rawDataField != null)
            {
                constructorParameters.Add(new ParameterProvider(
                    _rawDataField.Name.ToVariableName(),
                    FormattableStringHelpers.FromString(PrivateAdditionalRawDataPropertyDescription),
                    _rawDataField.Type));
            }

            return constructorParameters;
        }

        private MethodProvider BuildEmptyConstructor()
        {
            var accessibility = _isStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new MethodProvider(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", null, accessibility, Array.Empty<ParameterProvider>()),
                bodyStatements: new MethodBodyStatement(),
                this);
        }

        /// <summary>
        /// Attempts to get the model argument type from the model interface.
        /// </summary>
        /// <param name="modelInterface">The <see cref="CSharpType"/> that represents the model interface.</param>
        /// <returns>The first argument type of <paramref name="modelInterface"/>.</returns>
        /// <exception cref="InvalidOperationException">Thrown if the <paramref name="modelInterface"/> contains no arguments.</exception>
        private CSharpType GetModelArgumentType(CSharpType modelInterface)
        {
            var interfaceArgs = modelInterface.Arguments;
            if (!interfaceArgs.Any())
            {
                throw new InvalidOperationException($"Expected at least 1 argument for {modelInterface}, but found none.");
            }

            return interfaceArgs[0];
        }

        /// <summary>
        /// Determines if the type requires a null check in serialization.
        /// </summary>
        /// <param name="type">The <see cref="CSharpType"/> to validate.</param>
        /// <returns><c>true</c> if the type requires a null check.</returns>
        private bool TypeRequiresNullCheckInSerialization(CSharpType type)
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

        private bool ShouldOverrideMethod()
        {
            return _model.Inherits != null && _model.Inherits is { IsFrameworkType: false, Implementation: ModelProvider };
        }
    }
}
