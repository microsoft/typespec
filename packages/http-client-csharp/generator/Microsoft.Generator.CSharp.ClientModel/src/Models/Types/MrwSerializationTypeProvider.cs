// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal sealed class MrwSerializationTypeProvider : TypeProvider
    {
        private readonly Parameter SerializationOptionsParameter =
            new("options", null, typeof(ModelReaderWriterOptions), null, ParameterValidationType.None, null);
        private readonly CSharpType _iJsonModelTInterface;
        private readonly CSharpType? _iJsonModelObjectInterface;
        private readonly CSharpType _iPersistableModelTInterface;
        private readonly CSharpType? _iPersistableModelObjectInterface;
        private ModelTypeProvider _model;

        public MrwSerializationTypeProvider(ModelTypeProvider model) : base(null)
        {
            _model = model;
            Name = model.Name;
            // Initialize the serialization interfaces
            _iJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), _model.Type);
            _iJsonModelObjectInterface = _model.IsStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            _iPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), _model.Type);
            _iPersistableModelObjectInterface = _model.IsStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
        }

        public override string Name { get; }

        /// <summary>
        /// Builds the serialization methods for the model. If the serialization supports JSON, it will build the JSON serialization methods.
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
            Parameter utf8JsonWriterParameter = new("writer", null, typeof(Utf8JsonWriter), null, ParameterValidationType.None, null);
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { utf8JsonWriterParameter, SerializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Add body for json properties' serialization https://github.com/microsoft/typespec/issues/3330
              Snippets.EmptyStatement
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method for the model.
        /// </summary>
        internal CSharpMethod BuildJsonModelCreateMethod()
        {
            Parameter utf8JsonReaderParameter = new("reader", null, typeof(Utf8JsonReader), null, ParameterValidationType.None, null, IsRef: true);
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iJsonModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { utf8JsonReaderParameter, SerializationOptionsParameter }, ExplicitInterface: _iJsonModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
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
                Snippets.Return(new NewInstanceExpression(returnType, new ValueExpression[] { new StringLiteralExpression(_iPersistableModelTInterface.Name, false) }))
            );
        }

        /// <summary>
        /// Builds the I model create method.
        /// </summary>
        internal CSharpMethod BuildIModelCreateMethod()
        {
            Parameter dataParameter = new("data", null, typeof(BinaryData), null, ParameterValidationType.None, null);
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(_iPersistableModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { dataParameter, SerializationOptionsParameter }, ExplicitInterface: _iPersistableModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>()))
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
