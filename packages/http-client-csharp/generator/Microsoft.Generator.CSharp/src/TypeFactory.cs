// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public abstract class TypeFactory
    {
        private ChangeTrackingListDefinition? _changeTrackingListProvider;
        private ChangeTrackingDictionaryDefinition? _changeTrackingDictionaryProvider;
        private ChangeTrackingListDefinition ChangeTrackingListProvider => _changeTrackingListProvider ??= new();
        private ChangeTrackingDictionaryDefinition ChangeTrackingDictionaryProvider => _changeTrackingDictionaryProvider ??= new();
        private Dictionary<CSharpType, TypeProvider> _csharpToTypeProvider = new Dictionary<CSharpType, TypeProvider>(new CSharpTypeComparer());

        private readonly IDictionary<InputType, CSharpType> _typeCache = new Dictionary<InputType, CSharpType>();

        public CSharpType CreateCSharpType(InputType inputType)
        {
            if (_typeCache.TryGetValue(inputType, out var type))
                return type;

            type = CreateCSharpTypeCore(inputType);
            _typeCache.Add(inputType, type);
            return type;
        }

        private static string GetDefaultModelNamespace()
        {
            if (CodeModelPlugin.Instance.Configuration.UseModelNamespace)
            {
                return $"{CodeModelPlugin.Instance.Configuration.Namespace}.Models";
            }

            return CodeModelPlugin.Instance.Configuration.Namespace;
        }

        /// <summary>
        /// Factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="inputType"/>.
        /// </summary>
        /// <param name="inputType">The <see cref="InputType"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpType"/>.</returns>
        protected virtual CSharpType CreateCSharpTypeCore(InputType inputType) => inputType switch
        {
            InputLiteralType literalType => CSharpType.FromLiteral(CreateCSharpType(literalType.ValueType), literalType.Value),
            InputUnionType unionType => CSharpType.FromUnion(unionType.VariantTypes.Select(CreateCSharpType).ToArray()),
            InputArrayType listType => new CSharpType(typeof(IList<>), CreateCSharpType(listType.ValueType)),
            InputDictionaryType dictionaryType => new CSharpType(typeof(IDictionary<,>), typeof(string), CreateCSharpType(dictionaryType.ValueType)),
            InputEnumType enumType => new CSharpType(enumType.Name.ToCleanName(), true, true, false, GetDefaultModelNamespace(), null, null, enumType.Usage.HasFlag(InputModelTypeUsage.Input)),
            InputModelType model => new CSharpType(model.Name.ToCleanName(), false, false, false, GetDefaultModelNamespace(), null, null, model.Usage.HasFlag(InputModelTypeUsage.Input)),
            InputNullableType nullableType => CreateCSharpType(nullableType.Type).WithNullable(true),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.Boolean => new CSharpType(typeof(bool)),
                InputPrimitiveTypeKind.Bytes => new CSharpType(typeof(BinaryData)),
                InputPrimitiveTypeKind.ContentType => new CSharpType(typeof(string)),
                InputPrimitiveTypeKind.PlainDate => new CSharpType(typeof(DateTimeOffset)),
                InputPrimitiveTypeKind.Decimal => new CSharpType(typeof(decimal)),
                InputPrimitiveTypeKind.Decimal128 => new CSharpType(typeof(decimal)),
                InputPrimitiveTypeKind.PlainTime => new CSharpType(typeof(TimeSpan)),
                InputPrimitiveTypeKind.Float32 => new CSharpType(typeof(float)),
                InputPrimitiveTypeKind.Float64 => new CSharpType(typeof(double)),
                InputPrimitiveTypeKind.Float128 => new CSharpType(typeof(decimal)),
                InputPrimitiveTypeKind.Guid or InputPrimitiveTypeKind.Uuid => new CSharpType(typeof(Guid)),
                InputPrimitiveTypeKind.Int8 => new CSharpType(typeof(sbyte)),
                InputPrimitiveTypeKind.UInt8 => new CSharpType(typeof(byte)),
                InputPrimitiveTypeKind.Int32 => new CSharpType(typeof(int)),
                InputPrimitiveTypeKind.Int64 => new CSharpType(typeof(long)),
                InputPrimitiveTypeKind.SafeInt => new CSharpType(typeof(long)),
                InputPrimitiveTypeKind.Integer => new CSharpType(typeof(long)), // in typespec, integer is the base type of int related types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Float => new CSharpType(typeof(double)), // in typespec, float is the base type of float32 and float64, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Numeric => new CSharpType(typeof(double)), // in typespec, numeric is the base type of number types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.IPAddress => new CSharpType(typeof(IPAddress)),
                InputPrimitiveTypeKind.Stream => new CSharpType(typeof(Stream)),
                InputPrimitiveTypeKind.String => new CSharpType(typeof(string)),
                InputPrimitiveTypeKind.Uri or InputPrimitiveTypeKind.Url => new CSharpType(typeof(Uri)),
                InputPrimitiveTypeKind.Char => new CSharpType(typeof(char)),
                InputPrimitiveTypeKind.Any => new CSharpType(typeof(BinaryData)),
                _ => new CSharpType(typeof(object)),
            },
            InputDateTimeType dateTimeType => new CSharpType(typeof(DateTimeOffset)),
            InputDurationType durationType => new CSharpType(typeof(TimeSpan)),
            _ => throw new InvalidOperationException($"Unknown type: {inputType}")
        };

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an <see cref="InputModelType"> <paramref name="model"/>.
        /// </summary>
        /// <param name="model">The <see cref="InputModelType"/> to convert.</param>
        /// <returns>An instance of <see cref="TypeProvider"/>.</returns>
        public TypeProvider CreateModel(InputModelType model)
        {
            var modelProvider = CreateModelCore(model);
            _csharpToTypeProvider.Add(modelProvider.Type, modelProvider);
            return modelProvider;
        }

        protected virtual TypeProvider CreateModelCore(InputModelType model) => new ModelProvider(model);

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an <see cref="InputEnumType"> <paramref name="enumType"/>.
        /// </summary>
        /// <param name="enumType">The <see cref="InputEnumType"/> to convert.</param>
        /// <returns>An instance of <see cref="TypeProvider"/>.</returns>
        public TypeProvider CreateEnum(InputEnumType enumType)
        {
            var enumProvider = CreateEnumCore(enumType);
            _csharpToTypeProvider.Add(enumProvider.Type, enumProvider);
            return enumProvider;
        }

        protected virtual TypeProvider CreateEnumCore(InputEnumType enumType) => EnumProvider.Create(enumType);

        /// <summary>
        /// Factory method for creating a <see cref="ParameterProvider"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="ParameterProvider"/>.</returns>
        public virtual ParameterProvider CreateParameter(InputParameter parameter) => new ParameterProvider(parameter);

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        public virtual MethodProviderCollection CreateMethod(InputOperation operation, TypeProvider enclosingType) => new(operation, enclosingType);

        /// <summary>
        /// Factory method for retrieving the serialization format for a given input type.
        /// </summary>
        /// <param name="input">The <see cref="InputType"/> to retrieve the serialization format for.</param>
        /// <returns>The <see cref="SerializationFormat"/> for the input type.</returns>
        public SerializationFormat GetSerializationFormat(InputType input) => input switch
        {
            InputLiteralType literalType => GetSerializationFormat(literalType.ValueType),
            InputArrayType listType => GetSerializationFormat(listType.ValueType),
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
        public virtual CSharpType ListInitializationType => ChangeTrackingListProvider.Type;

        /// <summary>
        /// The initialization type of dictionary properties. This type should implement both <see cref="IDictionary{TKey, TValue}"/> and <see cref="IReadOnlyDictionary{TKey, TValue}"/>.
        /// </summary>
        public virtual CSharpType DictionaryInitializationType => ChangeTrackingDictionaryProvider.Type;

        private class CSharpTypeComparer : IEqualityComparer<CSharpType>
        {
            public bool Equals(CSharpType? x, CSharpType? y)
            {
                if (ReferenceEquals(x, y))
                    return true;
                if (x is null || y is null)
                    return false;
                return x.Equals(y, true);
            }

            public int GetHashCode(CSharpType obj)
            {
                var hashCode = new HashCode();
                foreach (var arg in obj.Arguments)
                {
                    hashCode.Add(arg);
                }
                return HashCode.Combine(obj.Name, obj.Namespace, obj.IsValueType, obj.IsFrameworkType ? obj.FrameworkType : null, hashCode.ToHashCode());
            }
        }

        public TypeProvider? GetProvider(CSharpType type)
        {
            if (_csharpToTypeProvider.TryGetValue(type, out var provider))
                return provider;
            return null;
        }
    }
}
