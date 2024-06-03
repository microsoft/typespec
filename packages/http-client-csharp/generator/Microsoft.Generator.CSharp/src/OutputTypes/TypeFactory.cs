// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

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
        /// Factory method for creating a <see cref="Parameter"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="Parameter"/>.</returns>
        public abstract Parameter CreateCSharpParam(InputParameter parameter);

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
            InputLiteralType literalType => GetSerializationFormat(literalType.LiteralValueType),
            InputList listType => GetSerializationFormat(listType.ElementType),
            InputDictionary dictionaryType => GetSerializationFormat(dictionaryType.ValueType),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.BytesBase64Url => SerializationFormat.Bytes_Base64Url,
                InputPrimitiveTypeKind.Bytes => SerializationFormat.Bytes_Base64,
                InputPrimitiveTypeKind.Date => SerializationFormat.Date_ISO8601,
                InputPrimitiveTypeKind.DateTime => SerializationFormat.DateTime_ISO8601,
                InputPrimitiveTypeKind.DateTimeISO8601 => SerializationFormat.DateTime_ISO8601,
                InputPrimitiveTypeKind.DateTimeRFC1123 => SerializationFormat.DateTime_RFC1123,
                InputPrimitiveTypeKind.DateTimeRFC3339 => SerializationFormat.DateTime_RFC3339,
                InputPrimitiveTypeKind.DateTimeRFC7231 => SerializationFormat.DateTime_RFC7231,
                InputPrimitiveTypeKind.DateTimeUnix => SerializationFormat.DateTime_Unix,
                InputPrimitiveTypeKind.DurationISO8601 => SerializationFormat.Duration_ISO8601,
                InputPrimitiveTypeKind.DurationConstant => SerializationFormat.Duration_Constant,
                InputPrimitiveTypeKind.DurationSeconds => SerializationFormat.Duration_Seconds,
                InputPrimitiveTypeKind.DurationSecondsFloat => SerializationFormat.Duration_Seconds_Float,
                InputPrimitiveTypeKind.Time => SerializationFormat.Time_ISO8601,
                _ => SerializationFormat.Default
            },
            _ => SerializationFormat.Default
        };

        public abstract CSharpType MatchConditionsType();
        public abstract CSharpType RequestConditionsType();
        public abstract CSharpType TokenCredentialType();
        public abstract CSharpType PageResponseType();

        /// <summary>
        /// The type that represents the implementation of list properties. This type should implement both <see cref="IList{T}"/> and <see cref="IReadOnlyList{T}"/>.
        /// </summary>
        public virtual CSharpType ListImplementationType => ChangeTrackingListProvider.Instance.Type;

        /// <summary>
        /// The type that represents the implementation of dictionary properties. This type should implement both <see cref="IDictionary{TKey, TValue}"/> and <see cref="IReadOnlyDictionary{TKey, TValue}"/>.
        /// </summary>
        public virtual CSharpType DictionaryImplementationType => ChangeTrackingDictionaryProvider.Instance.Type;
    }
}
