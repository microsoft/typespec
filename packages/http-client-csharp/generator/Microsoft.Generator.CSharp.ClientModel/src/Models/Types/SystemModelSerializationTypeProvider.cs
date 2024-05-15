// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// This class provides the set of serialization models, methods, and interfaces for a given model.
    /// </summary>
    internal sealed class SystemModelSerializationTypeProvider : TypeProvider
    {
        internal static readonly Parameter SerializationOptionsParameter =
            new("options", null, typeof(ModelReaderWriterOptions), null, ValidationType.None, null);

        public SystemModelSerializationTypeProvider(ModelTypeProvider model) : base(null)
        {
            Model = model;
            Name = model.Name;
            Json = BuildJsonSerialization();
            // Initialize the serialization interfaces
            IJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), Model.Type);
            IJsonModelObjectInterface = Model.IsStruct ? new CSharpType(typeof(IJsonModel<object>)) : null;
            IPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), Model.Type);
            IPersistableModelObjectInterface = Model.IsStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
        }

        public override string Name { get; }
        public ModelTypeProvider Model { get; }
        public JsonObjectSerialization? Json { get; }
        public CSharpType IJsonModelTInterface { get; }
        public CSharpType? IJsonModelObjectInterface { get; }
        public CSharpType IPersistableModelTInterface { get; }
        public CSharpType? IPersistableModelObjectInterface { get; }

        protected override CSharpMethod[] BuildMethods()
        {
            return BuildSerializationMethods();
        }

        /// <summary>
        /// Builds the types that the model type serialization implements.
        /// </summary>
        /// <returns>An array of <see cref="CSharpType"/> types that the model implements.</returns>
        protected override CSharpType[] BuildImplements()
        {
            var interfaces = new List<CSharpType>
            {
                IJsonModelTInterface,
            };

            if (IJsonModelObjectInterface != null)
            {
                interfaces.Add(IJsonModelObjectInterface);
            }

            return interfaces.ToArray();
        }

        /// <summary>
        /// Builds the serialization methods for the model. If the serialization supports JSON, it will build the JSON serialization methods.
        /// </summary>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        private CSharpMethod[] BuildSerializationMethods()
        {
            var methods = new List<CSharpMethod>();

            // Build the JSON serialization methods
            if (Json != null)
            {
                foreach (var method in BuildJsonSerializationMethods())
                {
                    methods.Add(method);
                }

                // TO-DO: Add deserialization methods if applicable https://github.com/microsoft/typespec/issues/3330
            }

            // Build the IModel methods
            var iModelMethods = BuildIModelMethods();
            methods.AddRange(iModelMethods);

            return methods.ToArray();
        }

        /// <summary>
        /// Builds the JSON serialization methods for the model.
        /// </summary>
        /// <returns>A list of JSON serialization and deserialization methods for the model.</returns>
        private IList<CSharpMethod> BuildJsonSerializationMethods()
        {
            var methods = new List<CSharpMethod>
            {
                BuildJsonModelWriteMethod(IJsonModelTInterface),
                BuildJsonModelCreateMethod(IJsonModelTInterface)
            };

            return methods;
        }

        /// <summary>
        /// Builds the I model methods for the model.
        /// </summary>
        /// <returns>A list of I model methods.</returns>
        private IList<CSharpMethod> BuildIModelMethods()
        {
            var methods = new List<CSharpMethod>
            {
                BuildIModelWriteMethod(IPersistableModelTInterface),
                BuildIModelCreateMethod(IPersistableModelTInterface),
                BuildIModelGetFormatFromOptionsMethod(IPersistableModelTInterface)
            };

            return methods;
        }

        private JsonObjectSerialization? BuildJsonSerialization()
        {
            // TO-DO: Add json property serialization https://github.com/microsoft/typespec/issues/3330
            if (Model.IsPropertyBag)
            {
                return null;
            }

            return new(this, Array.Empty<Parameter>());
        }

        /// <summary>
        /// Builds the JSON serialization write method for the model.
        /// <param name="iJsonModelTInterface">The <see cref="CSharpType"/> that represents the IJsonModel interface.</param>.
        /// </summary>
        internal static CSharpMethod BuildJsonModelWriteMethod(CSharpType iJsonModelTInterface)
        {
            Parameter utf8JsonWriterParameter = new("writer", null, typeof(Utf8JsonWriter), null, ValidationType.None, null);
            // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { utf8JsonWriterParameter, SerializationOptionsParameter }, ExplicitInterface: iJsonModelTInterface),
              // TO-DO: Add body for json properties' serialization https://github.com/microsoft/typespec/issues/3330
              Snippets.EmptyStatement,
              new CSharpMethodKinds(SystemCSharpMethodKinds.JsonModelSerializationWrite)
            );
        }

        /// <summary>
        /// Builds the JSON serialization create method for the model.
        /// <param name="iJsonModelTInterface">The <see cref="CSharpType"/> that represents the IJsonModel interface.</param>.
        /// </summary>
        internal static CSharpMethod BuildJsonModelCreateMethod(CSharpType iJsonModelTInterface)
        {
            Parameter utf8JsonReaderParameter = new("reader", null, typeof(Utf8JsonReader), null, ValidationType.None, null, IsRef: true);
            // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(iJsonModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { utf8JsonReaderParameter, SerializationOptionsParameter }, ExplicitInterface: iJsonModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>())),
              new CSharpMethodKinds(SystemCSharpMethodKinds.JsonModelDeserializationCreate)
            );
        }

        /// <summary>
        /// Builds the I model write method.
        /// <param name="iPersistableModelTInterface">The <see cref="CSharpType"/> that represents the IPersistableModelT interface.</param>.
        /// </summary>
        internal static CSharpMethod BuildIModelWriteMethod(CSharpType iPersistableModelTInterface)
        {
            // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
            var returnType = typeof(BinaryData);
            return new CSharpMethod
            (
                new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, returnType, null, new[] { SerializationOptionsParameter }, ExplicitInterface: iPersistableModelTInterface),
                // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                Snippets.Return(new NewInstanceExpression(returnType, new ValueExpression[] { new StringLiteralExpression(iPersistableModelTInterface.Name, false) })),
                new CSharpMethodKinds(SystemCSharpMethodKinds.IModelSerializationWrite)
            );
        }

        /// <summary>
        /// Builds the I model create method.
        /// <param name="iPersistableModelTInterface">The <see cref="CSharpType"/> that represents the IPersistableModelT interface.</param>.
        /// </summary>
        internal static CSharpMethod BuildIModelCreateMethod(CSharpType iPersistableModelTInterface)
        {
            Parameter dataParameter = new("data", null, typeof(BinaryData), null, ValidationType.None, null);
            // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
            var typeOfT = GetModelArgumentType(iPersistableModelTInterface);
            return new CSharpMethod
            (
              new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { dataParameter, SerializationOptionsParameter }, ExplicitInterface: iPersistableModelTInterface),
              // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
              Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>())),
              new CSharpMethodKinds(SystemCSharpMethodKinds.IModelDeserializationCreate)
            );
        }

        /// <summary>
        /// Builds the I model GetFormatFromOptions method.
        /// <param name="iPersistableModelTInterface">The <see cref="CSharpType"/> that represents the IPersistableModelT interface.</param>.
        /// </summary>
        internal static CSharpMethod BuildIModelGetFormatFromOptionsMethod(CSharpType iPersistableModelTInterface)
        {
            ValueExpression jsonWireFormat = Snippets.Literal("J");
            // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
            return new CSharpMethod
            (
              new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { SerializationOptionsParameter }, ExplicitInterface: iPersistableModelTInterface),
              jsonWireFormat,
              new CSharpMethodKinds(SystemCSharpMethodKinds.IModelGetFormat)
            );
        }

        /// <summary>
        /// Attempts to get the model argument type from the model interface.
        /// </summary>
        /// <param name="modelInterface">The <see cref="CSharpType"/> that represents the model interface.</param>
        /// <returns>The first argument type of <paramref name="modelInterface"/>.</returns>
        /// <exception cref="InvalidOperationException">Thrown if the <paramref name="modelInterface"/> contains no arguments.</exception>
        internal static CSharpType GetModelArgumentType(CSharpType modelInterface)
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
