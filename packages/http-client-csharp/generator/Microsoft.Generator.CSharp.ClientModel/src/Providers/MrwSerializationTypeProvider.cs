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
using Microsoft.CodeAnalysis;
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
    internal sealed class MrwSerializationTypeProvider : TypeProvider
    {
        private const string PrivateAdditionalPropertiesPropertyDescription = "Keeps track of any properties unknown to the library.";
        private const string PrivateAdditionalPropertiesPropertyName = "_serializedAdditionalRawData";
        private const string JsonModelWriteCoreMethodName = "JsonModelWriteCore";
        private const string WriteAction = "writing";
        private const string ReadAction = "reading";
        private readonly ParameterProvider _utf8JsonWriterParameter = new("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
        private readonly ParameterProvider _serializationOptionsParameter =
            new("options", $"The client options for reading and writing models.", typeof(ModelReaderWriterOptions));
        private readonly Utf8JsonWriterSnippet _utf8JsonWriterSnippet;
        private readonly ModelReaderWriterOptionsSnippet _mrwOptionsParameterSnippet;
        private readonly ScopedApi<bool> _isNotEqualToWireConditionSnippet;
        private readonly CSharpType _privateAdditionalPropertiesPropertyType = typeof(IDictionary<string, BinaryData>);
        private readonly CSharpType _jsonModelTInterface;
        private readonly CSharpType? _jsonModelObjectInterface;
        private readonly CSharpType _persistableModelTInterface;
        private readonly CSharpType? _persistableModelObjectInterface;
        private TypeProvider _model;
        private readonly InputModelType _inputModel;
        private readonly FieldProvider? _rawDataField;
        private readonly bool _isStruct;
        // Flag to determine if the model should override the serialization methods
        private readonly bool _shouldOverrideMethods;

        public MrwSerializationTypeProvider(TypeProvider provider, InputModelType inputModel)
        {
            _model = provider;
            _inputModel = inputModel;
            _isStruct = provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            // Initialize the serialization interfaces
            _jsonModelTInterface = new CSharpType(typeof(IJsonModel<>), provider.Type);
            _jsonModelObjectInterface = _isStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _persistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), provider.Type);
            _persistableModelObjectInterface = _isStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            _rawDataField = BuildRawDataField();
            _shouldOverrideMethods = _model.Inherits != null && _model.Inherits is { IsFrameworkType: false, Implementation: TypeProvider };
            _utf8JsonWriterSnippet = new Utf8JsonWriterSnippet(_utf8JsonWriterParameter);
            _mrwOptionsParameterSnippet = new ModelReaderWriterOptionsSnippet(_serializationOptionsParameter);
            _isNotEqualToWireConditionSnippet = _mrwOptionsParameterSnippet.Format.NotEqual(ModelReaderWriterOptionsSnippet.WireFormat);

            Name = provider.Name;
            Namespace = provider.Namespace;
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _model.DeclarationModifiers;

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");
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
                name: PrivateAdditionalPropertiesPropertyName);

            return FieldProvider;
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
                BuildJsonModelCreateMethod(),
                // Add PersistableModel serialization methods
                BuildPersistableModelWriteMethod(),
                BuildPersistableModelCreateMethod(),
                BuildPersistableModelGetFormatFromOptionsMethod(),
                //cast operators
                BuildImplicitToBinaryContent(),
                BuildExplicitFromClientResult()
            };

            if (_isStruct)
            {
                methods.Add(BuildJsonModelWriteMethodObjectDeclaration());
            }

            return [.. methods];
        }

        private MethodProvider BuildExplicitFromClientResult()
        {
            var result = new ParameterProvider("result", $"The {typeof(ClientResult):C} to deserialize the {Type:C} from.", typeof(ClientResult));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;
            return new MethodProvider(
                new MethodSignature(Type.Name, null, modifiers, null, null, [result]),
                Throw(New.NotImplementedException(Literal("Not implemented"))), //TODO https://github.com/microsoft/typespec/issues/3696
                this);
        }

        private MethodProvider BuildImplicitToBinaryContent()
        {
            var model = new ParameterProvider(Type.Name.ToVariableName(), $"The {Type:C} to serialize into {typeof(BinaryContent):C}", Type);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;
            return new MethodProvider(
                new MethodSignature(nameof(BinaryContent), null, modifiers, null, null, [model]),
                Throw(New.NotImplementedException(Literal("Not implemented"))), //TODO https://github.com/microsoft/typespec/issues/3696
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
        /// Builds the <see cref="IJsonModel{T}"/> create method for the model.
        /// </summary>
        internal MethodProvider BuildJsonModelCreateMethod()
        {
            ParameterProvider utf8JsonReaderParameter = new("reader", $"The JSON reader.", typeof(Utf8JsonReader), isRef: true);
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_jsonModelTInterface);
            return new MethodProvider
            (
                new MethodSignature(nameof(IJsonModel<object>.Create), null, MethodSignatureModifiers.None, typeOfT, null, new[] { utf8JsonReaderParameter, _serializationOptionsParameter }, ExplicitInterface: _jsonModelTInterface),
                // Throw a not implemented exception until this method body is implemented https://github.com/microsoft/typespec/issues/3330
                Throw(New.NotImplementedException(Literal("Not implemented"))),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> write method.
        /// </summary>
        internal MethodProvider BuildPersistableModelWriteMethod()
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
            var returnType = typeof(BinaryData);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, MethodSignatureModifiers.None, returnType, null, new[] { _serializationOptionsParameter }, ExplicitInterface: _persistableModelTInterface),
                // Throw a not implemented exception until this method body is implemented https://github.com/microsoft/typespec/issues/3330
                Throw(New.NotImplementedException(Literal("Not implemented"))),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> create method.
        /// </summary>
        internal MethodProvider BuildPersistableModelCreateMethod()
        {
            ParameterProvider dataParameter = new("data", $"The data to parse.", typeof(BinaryData));
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_persistableModelTInterface);
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.Create), null, MethodSignatureModifiers.None, typeOfT, null, new[] { dataParameter, _serializationOptionsParameter }, ExplicitInterface: _persistableModelTInterface),
                // Throw a not implemented exception until this method body is implemented https://github.com/microsoft/typespec/issues/3330
                Throw(New.NotImplementedException(Literal("Not implemented"))),
                this
            );
        }

        /// <summary>
        /// Builds the <see cref="IPersistableModel{T}"/> GetFormatFromOptions method.
        /// </summary>
        internal MethodProvider BuildPersistableModelGetFormatFromOptionsMethod()
        {
            ValueExpression jsonWireFormat = SystemSnippet.JsonFormatSerialization;
            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new MethodProvider
            (
                new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, MethodSignatureModifiers.None, typeof(string), null, new[] { _serializationOptionsParameter }, ExplicitInterface: _persistableModelTInterface),
                jsonWireFormat,
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
                    MethodSignatureModifiers.Internal,
                    serializationCtorParameters),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(serializationCtorParameters)
                },
                this);
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
                CreateWriteAdditionalRawDataStatement()
            ];
        }

        private MethodBodyStatement CallBaseJsonModelWriteCore()
        {
            // base.<JsonModelWriteCore>()
            return _shouldOverrideMethods ?
                Base.Invoke(JsonModelWriteCoreMethodName, [_utf8JsonWriterParameter, _serializationOptionsParameter]).Terminate()
                : MethodBodyStatement.Empty;
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<ParameterProvider> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            foreach (var param in parameters)
            {
                if (param.Name == _rawDataField?.Name.ToVariableName())
                {
                    methodBodyStatements.Add(_rawDataField.Assign(param).Terminate());
                    continue;
                }

                ValueExpression initializationValue = param;
                var initializationStatement = param.AsPropertyExpression.Assign(initializationValue).Terminate();
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
                    FormattableStringHelpers.FromString(PrivateAdditionalPropertiesPropertyDescription),
                    _rawDataField.Type));
            }

            return constructorParameters;
        }

        private MethodProvider BuildEmptyConstructor()
        {
            var accessibility = _isStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new MethodProvider(
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
                new IfStatement(format.NotEqual(ModelReaderWriterOptionsSnippet.JsonFormat))
                {
                    ThrowValidationFailException(format, modelInterface.Arguments[0], action)
                },
            ];

            return statements;
        }

        private MethodBodyStatement GetConcreteFormat(ModelReaderWriterOptionsSnippet options, CSharpType iModelTInterface, out VariableExpression format)
        {
            var cast = This.CastTo(iModelTInterface);
            var invokeGetFormatFromOptions = cast.Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), options);
            var condition = new TernaryConditionalExpression(
                options.Format.Equal(ModelReaderWriterOptionsSnippet.WireFormat),
                invokeGetFormatFromOptions,
                options.Format);
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
            var propertyStatements = new MethodBodyStatement[propertyCount];
            for (var i = 0; i < propertyCount; i++)
            {
                var property = _model.Properties[i];
                var propertyWireInfo = property.WireInfo;
                var propertySerializationName = propertyWireInfo?.SerializedName ?? property.Name;
                var propertyMember = new MemberExpression(null, propertySerializationName);
                var propertySerializationFormat = propertyWireInfo?.SerializationFormat ?? SerializationFormat.Default;
                var propertyIsReadOnly = propertyWireInfo?.IsReadOnly ?? false;
                var propertyIsRequired = propertyWireInfo?.IsRequired ?? false;

                // Generate the serialization statements for the property
                var writePropertySerializationStatements = new MethodBodyStatement[]
                {
                    _utf8JsonWriterSnippet.WritePropertyName(propertySerializationName.ToVariableName()),
                    CreateSerializationStatement(property.Type, propertyMember, propertySerializationFormat)
                };

                // Wrap the serialization statement in a check for whether the property is defined
                var wrapInIsDefinedStatement = WrapInIsDefined(property, propertyMember, propertyIsRequired, propertyIsReadOnly, writePropertySerializationStatements);
                if (propertyIsReadOnly && wrapInIsDefinedStatement is not IfStatement)
                {
                    wrapInIsDefinedStatement = new IfStatement(_isNotEqualToWireConditionSnippet)
                    {
                        wrapInIsDefinedStatement
                    };
                }
                propertyStatements[i] = wrapInIsDefinedStatement;
            }

            return propertyStatements;
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
            MethodBodyStatement writePropertySerializationStatement)
        {
            var propertyType = propertyProvider.Type;

            // Create the first conditional statement to check if the property is defined
            if (propertyType.IsNullable)
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
                    .And(OptionalSnippet.IsCollectionDefined(propertyMemberExpression));
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
                new ForeachStatement("item", dictionary, out KeyValuePairSnippet keyValuePair)
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
            EnumerableSnippet array,
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
            return type switch
            {
                { SerializeAs: not null } or { IsFrameworkType: true } =>
                    SerializeValueType(type, serializationFormat, value, type.SerializeAs ?? type.FrameworkType),
                { Implementation: EnumProvider enumProvider } =>
                    SerializeEnumProvider(enumProvider, type, value),
                { Implementation: ModelProvider modelProvider } =>
                    _utf8JsonWriterSnippet.WriteObjectValue(value.As(modelProvider.Type), options: _mrwOptionsParameterSnippet),
                _ => throw new NotSupportedException($"Serialization of type {type.Name} is not supported.")
            };
        }

        private MethodBodyStatement SerializeEnumProvider(
            EnumProvider enumProvider,
            CSharpType type,
            ValueExpression value)
        {
            var enumerableSnippet = new EnumerableSnippet(type, value.NullableStructValue(type));
            if ((EnumIsIntValueType(enumProvider) && !enumProvider.IsExtensible) || EnumIsNumericValueType(enumProvider))
            {
                return _utf8JsonWriterSnippet.WriteNumberValue(enumProvider.ToSerial(enumerableSnippet));
            }
            else
            {
                return _utf8JsonWriterSnippet.WriteStringValue(enumProvider.ToSerial(enumerableSnippet));
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
                    new JsonElementSnippet(value).WriteTo(_utf8JsonWriterSnippet),
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
                _ => throw new NotSupportedException($"Type {nameof(valueType)} serialization is not supported.")
            };
        }

        private static bool ValueTypeIsNumber(Type valueType) =>
            valueType == typeof(decimal) ||
            valueType == typeof(double) ||
            valueType == typeof(float) ||
            valueType == typeof(long) ||
            valueType == typeof(int) ||
            valueType == typeof(short) ||
            valueType == typeof(sbyte) ||
            valueType == typeof(byte);

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

        private static EnumerableSnippet GetEnumerableExpression(ValueExpression expression, CSharpType enumerableType)
        {
            CSharpType itemType = enumerableType.IsReadOnlyMemory ? new CSharpType(typeof(ReadOnlySpan<>), enumerableType.Arguments[0]) :
                enumerableType.ElementType;

            return new EnumerableSnippet(itemType, expression);
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
                ? OptionalSnippet.IsCollectionDefined(propertyMemberExpression)
                : OptionalSnippet.IsDefined(propertyMemberExpression);
            var condition = isReadOnly ? _isNotEqualToWireConditionSnippet.And(isDefinedCondition) : isDefinedCondition;

            return new IfStatement(condition) { writePropertySerializationStatement };
        }

        /// <summary>
        /// Builds the JSON write core body statement for the additional raw data.
        /// </summary>
        /// <returns>The method body statement that writes the additional raw data.</returns>
        private MethodBodyStatement CreateWriteAdditionalRawDataStatement()
        {
            if (_rawDataField == null)
            {
                return MethodBodyStatement.Empty;
            }

            var rawDataMemberExp = new MemberExpression(null, _rawDataField.Name);
            var rawDataDictionaryExp = rawDataMemberExp.AsDictionary(_rawDataField.Type);
            var forEachStatement = new ForeachStatement("item", rawDataDictionaryExp, out KeyValuePairSnippet item)
            {
                _utf8JsonWriterSnippet.WritePropertyName(item.Key),
                CreateSerializationStatement(_rawDataField.Type.Arguments[1], item.Value, SerializationFormat.Default),
            };

            return new IfStatement(_isNotEqualToWireConditionSnippet.And(rawDataDictionaryExp.NotEqual(Null)))
            {
                forEachStatement,
            };
        }

        private static CSharpType GetModelArgumentType(CSharpType modelInterface)
        {
            var interfaceArgs = modelInterface.Arguments;
            if (!interfaceArgs.Any())
            {
                throw new InvalidOperationException($"Expected at least 1 argument for {modelInterface}, but found none.");
            }

            return interfaceArgs[0];
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

        private static bool EnumIsIntValueType(EnumProvider enumProvider)
        {
            var frameworkType = enumProvider.ValueType;
            return frameworkType.Equals(typeof(int)) || frameworkType.Equals(typeof(long));
        }

        private static bool EnumIsFloatValueType(EnumProvider enumProvider)
        {
            var frameworkType = enumProvider.ValueType;
            return frameworkType.Equals(typeof(float)) || frameworkType.Equals(typeof(double));
        }

        private static bool EnumIsNumericValueType(EnumProvider enumProvider)
        {
            return EnumIsIntValueType(enumProvider) || EnumIsFloatValueType(enumProvider);
        }
    }
}
