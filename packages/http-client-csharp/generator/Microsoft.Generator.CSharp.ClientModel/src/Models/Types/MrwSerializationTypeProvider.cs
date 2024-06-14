// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal sealed class MrwSerializationTypeProvider : TypeProvider
    {
        private readonly ParameterProvider _serializationOptionsParameter =
            new("options", $"The client options for reading and writing models.", typeof(ModelReaderWriterOptions));
        private const string _privateAdditionalPropertiesPropertyDescription = "Keeps track of any properties unknown to the library.";
        private const string _privateAdditionalPropertiesPropertyName = "_serializedAdditionalRawData";
        private static readonly CSharpType _privateAdditionalPropertiesPropertyType = typeof(IDictionary<string, BinaryData>);
        private readonly CSharpType _iJsonModelTInterface;
        private readonly CSharpType? _iJsonModelObjectInterface;
        private readonly CSharpType _iPersistableModelTInterface;
        private readonly CSharpType? _iPersistableModelObjectInterface;
        private ModelProvider _model;
        private InputModelType _inputModel;
        private readonly FieldProvider? _rawDataField;
        private readonly bool _isStruct;

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

        protected override string GetFileName() => Path.Combine("src", "Generated", "Models", $"{Name}.serialization.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _model.DeclarationModifiers;

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
            MethodProvider serializationConstructor = BuildSerializationConstructor();

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
                    if (initializationCtorParams.SequenceEqual(serializationConstructor.Signature.Parameters))
                    {
                        serializationCtorParamsMatch = true;
                    }
                }
            }

            // Add the serialization constructor if it doesn't match any of the existing constructors
            if (!serializationCtorParamsMatch)
            {
                constructors.Add(serializationConstructor);
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
                type: _privateAdditionalPropertiesPropertyType,
                name: _privateAdditionalPropertiesPropertyName);

            return FieldProvider;
        }

        /// <summary>
        /// Builds the serialization methods for the model.
        /// </summary>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        protected override MethodProvider[] BuildMethods()
        {
            // TO-DO: Add deserialization methods https://github.com/microsoft/typespec/issues/3330

            return new MethodProvider[]
            {
                // Add JSON serialization methods
                BuildJsonModelWriteMethod(),
                BuildJsonModelCreateMethod(),
                // Add IModel methods
                BuildIModelWriteMethod(),
                BuildIModelCreateMethod(),
                BuildIModelGetFormatFromOptionsMethod()
            };
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
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { utf8JsonWriterParameter, _serializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Add body for json properties' serialization https://github.com/microsoft/typespec/issues/3330
              Snippet.EmptyStatement
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateMethod()
        {
            ParameterProvider utf8JsonReaderParameter = new("reader", $"The JSON reader.", typeof(Utf8JsonReader), isRef: true);
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iJsonModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { utf8JsonReaderParameter, _serializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippet.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
            );
        }

        /// <summary>
        /// Builds the I model write method.
        /// </summary>
        internal MethodProvider BuildIModelWriteMethod()
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
            var returnType = typeof(BinaryData);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, returnType, null, new[] { _serializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
                // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                Snippet.Return(new NewInstanceExpression(returnType, [Snippet.Literal(_iPersistableModelTInterface.Name)]))
            );
        }

        /// <summary>
        /// Builds the I model create method.
        /// </summary>
        internal MethodProvider BuildIModelCreateMethod()
        {
            ParameterProvider dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iPersistableModelTInterface);
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { dataParameter, _serializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippet.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
            );
        }

        /// <summary>
        /// Builds the I model GetFormatFromOptions method.
        /// </summary>
        internal MethodProvider BuildIModelGetFormatFromOptionsMethod()
        {
            ValueExpression jsonWireFormat = SystemSnippets.JsonFormatSerialization;
            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new MethodProvider
            (
              new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { _serializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
              jsonWireFormat
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
                });
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
                var parameter = new ParameterProvider(property)
                {
                    Validation = ParameterValidationType.None,
                };
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
                    FormattableStringHelpers.FromString(_privateAdditionalPropertiesPropertyDescription),
                    _rawDataField.Type));
            }

            return constructorParameters;
        }

        private MethodProvider BuildEmptyConstructor()
        {
            var accessibility = _isStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new MethodProvider(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", null, accessibility, Array.Empty<ParameterProvider>()),
                bodyStatements: new MethodBodyStatement());
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
    }
}
