// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
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
        public abstract CSharpType CreateCSharpType(InputType input);

        /// <summary>
        /// Factory method for creating a <see cref="ParameterProvider"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="ParameterProvider"/>.</returns>
        public abstract ParameterProvider CreateCSharpParam(InputParameter parameter);

        /// <summary>
        /// Factory method for creating a <see cref="CSharpMethodCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpMethodCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        public abstract CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation);

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

        public abstract CSharpType MatchConditionsType();
        public abstract CSharpType RequestConditionsType();
        public abstract CSharpType TokenCredentialType();
        public abstract CSharpType PageResponseType();

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
