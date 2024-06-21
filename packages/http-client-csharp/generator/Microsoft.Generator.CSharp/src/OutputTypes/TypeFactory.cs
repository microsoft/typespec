// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public abstract class TypeFactory
    {
        /// <summary>
        /// Factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="input"/>.
        /// </summary>
        /// <param name="input">The <see cref="InputType"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpType"/>.</returns>
        public virtual CSharpType CreateCSharpType(InputType inputType) => inputType switch
        {
            InputLiteralType literalType => CSharpType.FromLiteral(CreateCSharpType(literalType.ValueType), literalType.Value),
            InputUnionType unionType => CSharpType.FromUnion(unionType.VariantTypes.Select(CreateCSharpType).ToArray(), unionType.IsNullable),
            InputListType { IsEmbeddingsVector: true } listType => new CSharpType(typeof(ReadOnlyMemory<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputListType listType => new CSharpType(typeof(IList<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputDictionaryType dictionaryType => new CSharpType(typeof(IDictionary<,>), inputType.IsNullable, typeof(string), CreateCSharpType(dictionaryType.ValueType)),
            InputEnumType inputEnum => CreateEnum(inputEnum).Type.WithNullable(inputEnum.IsNullable),
            InputModelType inputModel => CreateModel(inputModel).Type.WithNullable(inputModel.IsNullable),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.Boolean => new CSharpType(typeof(bool), inputType.IsNullable),
                InputPrimitiveTypeKind.Bytes => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputPrimitiveTypeKind.ContentType => new CSharpType(typeof(string), inputType.IsNullable),
                InputPrimitiveTypeKind.PlainDate => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.PlainTime => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.Float32 => new CSharpType(typeof(float), inputType.IsNullable),
                InputPrimitiveTypeKind.Float64 => new CSharpType(typeof(double), inputType.IsNullable),
                InputPrimitiveTypeKind.Float128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Guid or InputPrimitiveTypeKind.Uuid => new CSharpType(typeof(Guid), inputType.IsNullable),
                InputPrimitiveTypeKind.Int8 => new CSharpType(typeof(sbyte), inputType.IsNullable),
                InputPrimitiveTypeKind.UInt8 => new CSharpType(typeof(byte), inputType.IsNullable),
                InputPrimitiveTypeKind.Int32 => new CSharpType(typeof(int), inputType.IsNullable),
                InputPrimitiveTypeKind.Int64 => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.SafeInt => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.Integer => new CSharpType(typeof(long), inputType.IsNullable), // in typespec, integer is the base type of int related types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Float => new CSharpType(typeof(double), inputType.IsNullable), // in typespec, float is the base type of float32 and float64, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Numeric => new CSharpType(typeof(double), inputType.IsNullable), // in typespec, numeric is the base type of number types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.IPAddress => new CSharpType(typeof(IPAddress), inputType.IsNullable),
                InputPrimitiveTypeKind.Stream => new CSharpType(typeof(Stream), inputType.IsNullable),
                InputPrimitiveTypeKind.String => new CSharpType(typeof(string), inputType.IsNullable),
                InputPrimitiveTypeKind.Uri or InputPrimitiveTypeKind.Url => new CSharpType(typeof(Uri), inputType.IsNullable),
                InputPrimitiveTypeKind.Char => new CSharpType(typeof(char), inputType.IsNullable),
                InputPrimitiveTypeKind.Any => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                _ => new CSharpType(typeof(object), inputType.IsNullable),
            },
            InputDateTimeType dateTimeType => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
            InputDurationType durationType => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
            _ => throw new Exception("Unknown type")
        };

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an input model <paramref name="inputModel"/>.
        /// </summary>
        /// <param name="inputModel">The <see cref="InputModelType"/> to convert.</param>
        /// <returns>An instance of <see cref="TypeProvider"/> representing the model.</returns>
        public abstract TypeProvider CreateModel(InputModelType inputModel);

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an input enum <paramref name="inputEnum"/>.
        /// </summary>
        /// <param name="inputEnum">The <see cref="InputEnumType"/> to convert.</param>
        /// <returns>An instance of <see cref="TypeProvider"/> representing the enum.</returns>
        public abstract TypeProvider CreateEnum(InputEnumType inputEnum);

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an input client <paramref name="inputClient"/>.
        /// </summary>
        /// <param name="inputClient">The <see cref="InputClient"/> to convert.</param>
        /// <returns>An instance of <see cref="TypeProvider"/> representing the client.</returns>
        public abstract TypeProvider CreateClient(InputClient inputClient);

        /// <summary>
        /// Factory method for creating a <see cref="ParameterProvider"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="ParameterProvider"/>.</returns>
        public virtual ParameterProvider CreateCSharpParam(InputParameter parameter) => new ParameterProvider(parameter);

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        public abstract MethodProviderCollection? CreateMethodProviders(InputOperation operation, TypeProvider enclosingType);

        /// <summary>
        /// Factory method for retrieving the serialization format for a given input type.
        /// </summary>
        /// <param name="input">The <see cref="InputType"/> to retrieve the serialization format for.</param>
        /// <returns>The <see cref="SerializationFormat"/> for the input type.</returns>
        public SerializationFormat GetSerializationFormat(InputType input) => input switch
        {
            InputLiteralType literalType => GetSerializationFormat(literalType.ValueType),
            InputListType listType => GetSerializationFormat(listType.ElementType),
            InputDictionaryType dictionaryType => GetSerializationFormat(dictionaryType.ValueType),
            InputDateTimeType dateTimeType => dateTimeType.Encode switch
            {
                DateTimeKnownEncoding.Rfc3339 => SerializationFormat.DateTime_RFC3339,
                DateTimeKnownEncoding.Rfc7231 => SerializationFormat.DateTime_RFC7231,
                DateTimeKnownEncoding.UnixTimestamp => SerializationFormat.DateTime_Unix,
                _ => throw new IndexOutOfRangeException($"unknown encode {dateTimeType.Encode}"),
            },
            InputDurationType durationType => durationType.Encode switch
            {
                // there is no such thing as `DurationConstant`
                DurationKnownEncoding.Iso8601 => SerializationFormat.Duration_ISO8601,
                DurationKnownEncoding.Seconds => durationType.WireType.Kind switch
                {
                    InputPrimitiveTypeKind.Int32 => SerializationFormat.Duration_Seconds,
                    InputPrimitiveTypeKind.Float or InputPrimitiveTypeKind.Float32 => SerializationFormat.Duration_Seconds_Float,
                    _ => SerializationFormat.Duration_Seconds_Double
                },
                DurationKnownEncoding.Constant => SerializationFormat.Duration_Constant,
                _ => throw new IndexOutOfRangeException($"unknown encode {durationType.Encode}")
            },
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.PlainDate => SerializationFormat.Date_ISO8601,
                InputPrimitiveTypeKind.PlainTime => SerializationFormat.Time_ISO8601,
                InputPrimitiveTypeKind.Bytes => primitiveType.Encode switch
                {
                    BytesKnownEncoding.Base64 => SerializationFormat.Bytes_Base64,
                    BytesKnownEncoding.Base64Url => SerializationFormat.Bytes_Base64Url,
                    _ => throw new IndexOutOfRangeException($"unknown encode {primitiveType.Encode}")
                },
                _ => SerializationFormat.Default
            },
            _ => SerializationFormat.Default
        };

        /// <summary>
        /// The initialization type of list properties. This type should implement both <see cref="IList{T}"/> and <see cref="IReadOnlyList{T}"/>.
        /// </summary>
        public virtual CSharpType ListInitializationType => ChangeTrackingListProvider.Instance.Type;

        /// <summary>
        /// The initialization type of dictionary properties. This type should implement both <see cref="IDictionary{TKey, TValue}"/> and <see cref="IReadOnlyDictionary{TKey, TValue}"/>.
        /// </summary>
        public virtual CSharpType DictionaryInitializationType => ChangeTrackingDictionaryProvider.Instance.Type;
    }
}
