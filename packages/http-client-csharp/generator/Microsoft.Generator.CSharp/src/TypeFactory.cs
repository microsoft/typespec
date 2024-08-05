// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class TypeFactory
    {
        private ChangeTrackingListDefinition? _changeTrackingListProvider;
        private ChangeTrackingListDefinition ChangeTrackingListProvider => _changeTrackingListProvider ??= new();

        private ChangeTrackingDictionaryDefinition? _changeTrackingDictionaryProvider;
        private ChangeTrackingDictionaryDefinition ChangeTrackingDictionaryProvider => _changeTrackingDictionaryProvider ??= new();

        private Dictionary<InputType, TypeProvider?>? _csharpToTypeProvider;
        private Dictionary<InputType, TypeProvider?> CSharpToTypeProvider => _csharpToTypeProvider ??= [];

        private Dictionary<EnumCacheKey, TypeProvider?>? _enumCache;
        private Dictionary<EnumCacheKey, TypeProvider?> EnumCache => _enumCache ??= [];

        private Dictionary<InputType, CSharpType>? _typeCache;
        private Dictionary<InputType, CSharpType> TypeCache => _typeCache ??= [];

        private HashSet<InputType>? _nullTypes;
        private HashSet<InputType> NullTypes => _nullTypes ??= [];

        private Dictionary<InputModelProperty, PropertyProvider?>? _propertyCache;
        private Dictionary<InputModelProperty, PropertyProvider?> PropertyCache => _propertyCache ??= [];

        private Dictionary<InputParameter, ParameterProvider>? _parameterCache;
        private Dictionary<InputParameter, ParameterProvider> ParameterCache => _parameterCache ??= [];

        private Dictionary<InputType, IReadOnlyList<TypeProvider>>? _serializationsCache;
        private IList<LibraryVisitor> Visitors => CodeModelPlugin.Instance.Visitors;
        private Dictionary<InputType, IReadOnlyList<TypeProvider>> SerializationsCache => _serializationsCache ??= [];

        protected internal TypeFactory()
        {
        }

        public CSharpType? CreateCSharpType(InputType inputType)
        {
            if (NullTypes.Contains(inputType))
            {
                return null;
            }

            CSharpType? type = CreateCSharpTypeCore(inputType);

            if (type == null)
            {
                NullTypes.Add(inputType);
            }

            return type;
        }

        private protected virtual CSharpType? CreateCSharpTypeCore(InputType inputType)
        {
            CSharpType? type;
            switch (inputType)
            {
                case InputLiteralType literalType:
                    var input = CreateCSharpType(literalType.ValueType);
                    type = input != null ? CSharpType.FromLiteral(input, literalType.Value) : null;
                    break;
                case InputUnionType unionType:
                    var unionInputs = new List<CSharpType>();
                    foreach (var variant in unionType.VariantTypes)
                    {
                        var unionInput = CreateCSharpType(variant);
                        if (unionInput != null)
                        {
                            unionInputs.Add(unionInput);
                        }
                    }
                    type = CSharpType.FromUnion(unionInputs);
                    break;
                case InputArrayType listType:
                    var arrayInput = CreateCSharpType(listType.ValueType);
                    type = arrayInput != null ? new CSharpType(typeof(IList<>), arrayInput) : null;
                    break;
                case InputDictionaryType dictionaryType:
                    var inputValueType = CreateCSharpType(dictionaryType.ValueType);
                    type = inputValueType != null ? new CSharpType(typeof(IDictionary<,>), typeof(string), inputValueType) : null;
                    break;
                case InputEnumType enumType:
                    type = CreateEnum(enumType)?.Type;
                    break;
                case InputModelType modelType:
                    type = CreateModel(modelType)?.Type;
                    break;
                case InputNullableType nullableType:
                    type = CreateCSharpType(nullableType.Type)?.WithNullable(true);
                    break;
                default:
                    type = CreatePrimitiveCSharpType(inputType);
                    break;
            }

            return type;
        }

        internal CSharpType CreatePrimitiveCSharpType(InputType inputType)
        {
            if (TypeCache.TryGetValue(inputType, out var type))
                return type;

            type = CreatePrimitiveCSharpTypeCore(inputType);
            TypeCache.Add(inputType, type);
            return type;
        }

        /// <summary>
        /// Factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="inputType"/>.
        /// </summary>
        /// <param name="inputType">The <see cref="InputType"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpType"/>.</returns>
        private protected virtual CSharpType CreatePrimitiveCSharpTypeCore(InputType inputType) => inputType switch
        {
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.Boolean => new CSharpType(typeof(bool)),
                InputPrimitiveTypeKind.Bytes => new CSharpType(typeof(BinaryData)),
                InputPrimitiveTypeKind.PlainDate => new CSharpType(typeof(DateTimeOffset)),
                InputPrimitiveTypeKind.Decimal => new CSharpType(typeof(decimal)),
                InputPrimitiveTypeKind.Decimal128 => new CSharpType(typeof(decimal)),
                InputPrimitiveTypeKind.PlainTime => new CSharpType(typeof(TimeSpan)),
                InputPrimitiveTypeKind.Float32 => new CSharpType(typeof(float)),
                InputPrimitiveTypeKind.Float64 => new CSharpType(typeof(double)),
                InputPrimitiveTypeKind.Int8 => new CSharpType(typeof(sbyte)),
                InputPrimitiveTypeKind.UInt8 => new CSharpType(typeof(byte)),
                InputPrimitiveTypeKind.Int32 => new CSharpType(typeof(int)),
                InputPrimitiveTypeKind.Int64 => new CSharpType(typeof(long)),
                InputPrimitiveTypeKind.SafeInt => new CSharpType(typeof(long)),
                InputPrimitiveTypeKind.Integer => new CSharpType(typeof(long)), // in typespec, integer is the base type of int related types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Float => new CSharpType(typeof(double)), // in typespec, float is the base type of float32 and float64, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Numeric => new CSharpType(typeof(double)), // in typespec, numeric is the base type of number types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Stream => new CSharpType(typeof(Stream)),
                InputPrimitiveTypeKind.String => new CSharpType(typeof(string)),
                InputPrimitiveTypeKind.Url => new CSharpType(typeof(Uri)),
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
        public TypeProvider? CreateModel(InputModelType model)
        {
            if (CSharpToTypeProvider.TryGetValue(model, out var modelProvider))
                return modelProvider;

            modelProvider = CreateModelCore(model);
            CSharpToTypeProvider.Add(model, modelProvider);
            return modelProvider;
        }

        private TypeProvider? CreateModelCore(InputModelType model)
        {
            TypeProvider? type = new ModelProvider(model);
            if (Visitors.Count == 0)
            {
                return type;
            }
            foreach (var visitor in Visitors)
            {
                type = visitor.Visit(model, type);
            }

            return type;
        }

        /// <summary>
        /// Factory method for creating a <see cref="TypeProvider"/> based on an <see cref="InputEnumType"> <paramref name="enumType"/>.
        /// </summary>
        /// <param name="enumType">The <see cref="InputEnumType"/> to convert.</param>
        /// <param name="declaringType"/> The declaring <see cref="TypeProvider".</param>
        /// <returns>An instance of <see cref="TypeProvider"/>.</returns>
        public TypeProvider? CreateEnum(InputEnumType enumType, TypeProvider? declaringType = null)
        {
            var enumCacheKey = new EnumCacheKey(enumType, declaringType);
            if (EnumCache.TryGetValue(enumCacheKey, out var enumProvider))
                return enumProvider;

            enumProvider = CreateEnumCore(enumType, declaringType);
            EnumCache.Add(enumCacheKey, enumProvider);
            return enumProvider;
        }

        private TypeProvider? CreateEnumCore(InputEnumType enumType, TypeProvider? declaringType)
        {
            TypeProvider? type = EnumProvider.Create(enumType, declaringType);
            if (Visitors.Count == 0)
            {
                return type;
            }
            foreach (var visitor in Visitors)
            {
                type = visitor.Visit(enumType, declaringType);
            }
            return type;
        }

        /// <summary>
        /// Factory method for creating a <see cref="ParameterProvider"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="ParameterProvider"/>.</returns>
        public virtual ParameterProvider CreateParameter(InputParameter parameter)
        {
            if (ParameterCache.TryGetValue(parameter, out var parameterProvider))
                return parameterProvider;

            parameterProvider = new ParameterProvider(parameter);
            ParameterCache.Add(parameter, parameterProvider);
            return parameterProvider;
        }

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        public MethodProviderCollection? CreateMethods(InputOperation operation, TypeProvider enclosingType)
        {
            var methods = new MethodProviderCollection(operation, enclosingType);
            if (Visitors.Count == 0)
            {
                return methods;
            }
            foreach (var visitor in Visitors)
            {
                methods = visitor.Visit(operation, enclosingType, methods);
            }
            return methods;
        }

        /// <summary>
        /// Creates a <see cref="PropertyProvider"/> based on an input property <paramref name="property"/>.
        /// </summary>
        /// <param name="property">The input property.</param>
        /// <returns>The property provider.</returns>
        public PropertyProvider? CreatePropertyProvider(InputModelProperty property)
        {
            if (PropertyCache.TryGetValue(property, out var propertyProvider))
                return propertyProvider;

            propertyProvider = CreatePropertyProviderCore(property);
            PropertyCache.Add(property, propertyProvider);
            return propertyProvider;
        }

        /// <summary>
        /// Factory method for creating a <see cref="PropertyProvider"/> based on an input property <paramref name="property"/>.
        /// </summary>
        /// <param name="property">The input model property.</param>
        /// <returns>An instance of <see cref="PropertyProvider"/>.</returns>
        private PropertyProvider? CreatePropertyProviderCore(InputModelProperty property)
        {
            {
                PropertyProvider.TryCreate(property, out var propertyProvider);
                if (Visitors.Count == 0)
                {
                    return propertyProvider;
                }
                foreach (var visitor in Visitors)
                {
                    propertyProvider = visitor.Visit(property, propertyProvider);
                }
                return propertyProvider;
            }
        }

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

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="inputType">The input model.</param>
        /// <param name="typeProvider">The type provider.</param>
        public IReadOnlyList<TypeProvider> CreateSerializations(InputType inputType, TypeProvider typeProvider)
        {
            if (SerializationsCache.TryGetValue(inputType, out var serializations))
                return serializations;

            serializations = CreateSerializationsCore(inputType, typeProvider);
            SerializationsCache.Add(inputType, serializations);
            return serializations;
        }

        protected virtual IReadOnlyList<TypeProvider> CreateSerializationsCore(InputType inputType, TypeProvider typeProvider)
        {
            return [];
        }

        private readonly struct EnumCacheKey
        {
            public InputEnumType EnumType { get; }
            public TypeProvider? DeclaringType { get; }
            public EnumCacheKey(InputEnumType enumType, TypeProvider? declaringType)
            {
                EnumType = enumType;
                DeclaringType = declaringType;
            }
        }
    }
}
