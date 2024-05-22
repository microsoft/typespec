// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal sealed class MrwSerializationTypeProvider : TypeProvider
    {
        private readonly Parameter SerializationOptionsParameter =
            new("options", null, typeof(ModelReaderWriterOptions), null, ValidationType.None, null);
        private const string _privateAdditionalPropertiesPropertyDescription = "Keeps track of any properties unknown to the library.";
        private const string _privateAdditionalPropertiesPropertyName = "_serializedAdditionalRawData";
        private static readonly CSharpType _privateAdditionalPropertiesPropertyType = typeof(IDictionary<string, BinaryData>);
        private readonly CSharpType _iJsonModelTInterface;
        private readonly CSharpType? _iJsonModelObjectInterface;
        private readonly CSharpType _iPersistableModelTInterface;
        private readonly CSharpType? _iPersistableModelObjectInterface;
        private ModelTypeProvider _model;
        private readonly FieldDeclaration _rawDataField;

        public MrwSerializationTypeProvider(ModelTypeProvider model) : base(null)
        {
            _model = model;
            Name = model.Name;
            // Initialize the serialization interfaces
            _iJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), model.Type);
            _iJsonModelObjectInterface = model.IsStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _iPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), model.Type);
            _iPersistableModelObjectInterface = model.IsStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            _rawDataField = BuildRawDataField();
        }

        public override string Name { get; }

        /// <summary>
        /// Builds the fields for the model by adding the raw data field for serialization.
        /// </summary>
        /// <returns>The list of <see cref="FieldDeclaration"/> for the model.</returns>
        protected override FieldDeclaration[] BuildFields()
        {
            return new FieldDeclaration[] { _rawDataField };
        }

        protected override CSharpMethod[] BuildConstructors()
        {
            List<CSharpMethod> constructors = new List<CSharpMethod>();
            bool serializationCtorParamsMatch = false;
            bool ctorWithNoParamsExist = false;
            CSharpMethod serializationConstructor = BuildSerializationConstructor();

            foreach (var ctor in _model.Constructors)
            {
                var initializationCtorParams = ctor.Signature.Parameters;

                // Check if the model constructor has no parameters
                if (!ctorWithNoParamsExist && !initializationCtorParams.Any())
                {
                    ctorWithNoParamsExist = true;
                }

                // Check if the model constructor parameters match the serialization constructor parameters
                var match = initializationCtorParams.SequenceEqual(
                    serializationConstructor.Signature.Parameters, Parameter.EqualityComparerByType);

                if (!serializationCtorParamsMatch && match)
                {
                    serializationCtorParamsMatch = true;
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
        /// <returns>The constructed <see cref="FieldDeclaration"/> if the model should generate the field.</returns>
        private FieldDeclaration BuildRawDataField()
        {
            FieldModifiers accessibility = _model.DerivedModels.Any() ? (FieldModifiers.Private | FieldModifiers.Protected) : FieldModifiers.Private;
            var fieldDeclaration = new FieldDeclaration(
                description: PropertyDescriptionBuilder.BuildDescriptionForBinaryData(
                    FormattableStringHelpers.FromString(_privateAdditionalPropertiesPropertyDescription),
                    _privateAdditionalPropertiesPropertyType,
                    SerializationFormat.Default),
                modifiers: accessibility,
                type: _privateAdditionalPropertiesPropertyType,
                name: _privateAdditionalPropertiesPropertyName);

            return fieldDeclaration;
        }

        /// <summary>
        /// Builds the serialization methods for the model.
        /// </summary>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        protected override CSharpMethod[] BuildMethods()
        {
            // TO-DO: Add deserialization methods https://github.com/microsoft/typespec/issues/3330

            return new CSharpMethod[]
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
        internal CSharpMethod BuildJsonModelWriteMethod()
        {
            Parameter utf8JsonWriterParameter = new("writer", null, typeof(Utf8JsonWriter), null, ValidationType.None, null);
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { utf8JsonWriterParameter, SerializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Add body for json properties' serialization https://github.com/microsoft/typespec/issues/3330
              EmptyStatement
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method for the model.
        /// </summary>
        internal CSharpMethod BuildJsonModelCreateMethod()
        {
            Parameter utf8JsonReaderParameter = new("reader", null, typeof(Utf8JsonReader), null, ValidationType.None, null, IsRef: true);
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iJsonModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { utf8JsonReaderParameter, SerializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
            );
        }

        /// <summary>
        /// Builds the I model write method.
        /// </summary>
        internal CSharpMethod BuildIModelWriteMethod()
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
            var returnType = typeof(BinaryData);
            return new CSharpMethod
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, returnType, null, new[] { SerializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
                // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                Return(new NewInstanceExpression(returnType, new ValueExpression[] { new StringLiteralExpression(_iPersistableModelTInterface.Name, false) }))
            );
        }

        /// <summary>
        /// Builds the I model create method.
        /// </summary>
        internal CSharpMethod BuildIModelCreateMethod()
        {
            Parameter dataParameter = new("data", null, typeof(BinaryData), null, ValidationType.None, null);
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iPersistableModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { dataParameter, SerializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
            );
        }

        /// <summary>
        /// Builds the I model GetFormatFromOptions method.
        /// </summary>
        internal CSharpMethod BuildIModelGetFormatFromOptionsMethod()
        {
            ValueExpression jsonWireFormat = SystemSnippets.JsonFormatSerialization;
            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new CSharpMethod
            (
              new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { SerializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
              jsonWireFormat
            );
        }

        /// <summary>
        /// Builds the serialization constructor for the model.
        /// </summary>
        /// <returns>The constructed serialization constructor.</returns>
        internal CSharpMethod BuildSerializationConstructor()
        {
            var serializationCtorParameters = BuildSerializationConstructorParameters();

            return new CSharpMethod(
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

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<Parameter> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            Dictionary<string, Parameter> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in _model.Properties)
            {
                Parameter? parameter = parameterMap.GetValueOrDefault(property.Name.ToVariableName());
                methodBodyStatements.Add(property.ToInitializationStatement(parameter));
            }

            if (parameterMap.TryGetValue(_rawDataField.Name.ToVariableName(), out var p) && p != null)
            {
                methodBodyStatements.Add(Assign(new MemberExpression(null, _rawDataField.Name), new ParameterReference(p)));
            }

            return methodBodyStatements;
        }

        /// <summary>
        /// Builds the parameters for the serialization constructor by iterating through the model properties.
        /// It then adds raw data field to the constructor if it doesn't already exist in the list of constructed parameters.
        /// </summary>
        /// <returns>The list of parameters for the serialization parameter.</returns>
        private IReadOnlyList<Parameter> BuildSerializationConstructorParameters()
        {
            List<Parameter> constructorParameters = new List<Parameter>();
            bool shouldAddRawDataField = true;

            foreach (var property in _model.Properties)
            {
                CSharpType propertyType = property.Type;
                var parameter = new Parameter(
                   Name: property.Name.ToVariableName(),
                   Description: FormattableStringHelpers.FromString(property.OriginalDescription) ?? property.Description,
                   Type: propertyType,
                   DefaultValue: null,
                   Validation: ValidationType.None,
                   Initializer: null);

                constructorParameters.Add(parameter);

                if (shouldAddRawDataField && string.Equals(parameter.Name, _rawDataField.Name, StringComparison.OrdinalIgnoreCase))
                {
                    shouldAddRawDataField = false;
                }
            }

            // Append the raw data field if it doesn't already exist in the constructor parameters
            if (shouldAddRawDataField)
            {
                var rawDataParameter = new Parameter(
                    Name: _rawDataField.Name.ToVariableName(),
                    Description: FormattableStringHelpers.FromString(_privateAdditionalPropertiesPropertyDescription),
                    Type: _rawDataField.Type,
                    DefaultValue: null,
                    Validation: ValidationType.None,
                    Initializer: null);

                constructorParameters.Add(rawDataParameter);
            }

            return constructorParameters;
        }

        private CSharpMethod BuildEmptyConstructor()
        {
            var accessibility = _model.IsStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new CSharpMethod(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", null, accessibility, Array.Empty<Parameter>()),
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
