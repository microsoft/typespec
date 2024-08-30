// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Primitives
{
    /// <summary>
    /// CSharpType represents the C# type of an input type.
    /// It is constructed from a <see cref="Type"/> and its properties.
    /// </summary>
    public class CSharpType
    {
        private readonly Type? _type;
        private object? _literal;
        private readonly Type? _underlyingType;
        private IReadOnlyList<CSharpType>? _unionItemTypes;

        private bool? _isReadOnlyMemory;
        private bool? _isList;
        private bool? _isArray;
        private bool? _isReadOnlyList;
        private bool? _isReadWriteList;
        private bool? _isDictionary;
        private bool? _isReadOnlyDictionary;
        private bool? _isReadWriteDictionary;
        private bool? _isCollection;
        private bool? _isIEnumerableOfT;
        private bool? _isIAsyncEnumerableOfT;
        private bool? _containsBinaryData;
        private int? _hashCode;
        private CSharpType? _propertyInitializationType;
        private CSharpType? _elementType;
        private CSharpType? _inputType;
        private CSharpType? _outputType;
        public bool IsReadOnlyMemory => _isReadOnlyMemory ??= TypeIsReadOnlyMemory();
        public bool IsList => _isList ??= TypeIsList();
        public bool IsArray => _isArray ??= TypeIsArray();
        internal bool IsReadOnlyList => _isReadOnlyList ??= TypeIsReadOnlyList();
        internal bool IsReadWriteList => _isReadWriteList ??= TypeIsReadWriteList();
        public bool IsDictionary => _isDictionary ??= TypeIsDictionary();
        internal bool IsReadOnlyDictionary => _isReadOnlyDictionary ??= TypeIsReadOnlyDictionary();
        internal bool IsReadWriteDictionary => _isReadWriteDictionary ??= TypeIsReadWriteDictionary();
        internal bool IsIEnumerableOfT => _isIEnumerableOfT ??= TypeIsIEnumerableOfT();
        internal bool IsIAsyncEnumerableOfT => _isIAsyncEnumerableOfT ??= TypeIsIAsyncEnumerableOfT();
        internal bool ContainsBinaryData => _containsBinaryData ??= TypeContainsBinaryData();

        /// <summary>
        /// Constructs a <see cref="CSharpType"/> from a <see cref="Type"/>.
        /// </summary>
        /// <param name="type">The base system type.</param>
        /// <param name="isNullable">Optional flag to determine if the constructed type should be nullable. Defaults to <c>false</c>.</param>
        public CSharpType(Type type, bool isNullable = false) : this(
            type,
            type.IsGenericType ? type.GetGenericArguments().Select(p => new CSharpType(p)).ToArray() : Array.Empty<CSharpType>(),
            isNullable)
        { }

        /// <summary>
        /// Constructs a non-nullable <see cref="CSharpType"/> from a <see cref="Type"/> with arguments
        /// </summary>
        /// <param name="type">The base system type.</param>
        /// <param name="arguments">The type's arguments.</param>
        public CSharpType(Type type, params CSharpType[] arguments) : this(type, arguments, false)
        { }

        /// <summary>
        /// Constructs a <see cref="CSharpType"/> from a <see cref="Type"/> with arguments.
        /// </summary>
        /// <param name="type">The base system type.</param>
        /// <param name="isNullable">Optional flag to determine if the constructed type should be nullable. Defaults to <c>false</c>.</param>
        /// <param name="arguments">The type's arguments.</param>
        public CSharpType(Type type, bool isNullable, params CSharpType[] arguments) : this(type, arguments, isNullable)
        { }

        /// <summary>
        /// Constructs a <see cref="CSharpType"/> from a <see cref="Type"/>.
        /// </summary>
        /// <param name="type">The base system type.</param>
        /// <param name="arguments">The type's arguments.</param>
        /// <param name="isNullable">Optional flag to determine if the constructed type should be nullable. Defaults to <c>false</c>.</param>
        public CSharpType(Type type, IReadOnlyList<CSharpType> arguments, bool isNullable = false)
        {
            Debug.Assert(type.Namespace != null, "type.Namespace != null");

            // handle nullable value types explicitly because they are implemented using generic type `System.Nullable<T>`
            var underlyingValueType = Nullable.GetUnderlyingType(type);
            if (underlyingValueType != null)
            {
                // in this block, we are converting input like `typeof(int?)` into the way as if they input: `typeof(int), isNullable: true`
                type = underlyingValueType;
                arguments = type.IsGenericType ? type.GetGenericArguments().Select(p => new CSharpType(p)).ToArray() : Array.Empty<CSharpType>();
                isNullable = true;
            }

            _type = type.IsGenericType ? type.GetGenericTypeDefinition() : type;
            ValidateArguments(_type, arguments);

            Name = type.IsGenericType ? type.Name.Substring(0, type.Name.IndexOf('`')) : type.Name;
            IsValueType = type.IsValueType;
            Namespace = type.Namespace ?? string.Empty;
            IsPublic = type.IsPublic && arguments.All(t => t.IsPublic);
            // open generic parameter such as the `T` in `List<T>` is considered as declared inside the `List<T>` type as well, but we just want this to be the pure nested type, therefore here we exclude the open generic parameter scenario
            // for a closed generic parameter such as the `string` in `List<string>`, it is just an ordinary type without a `DeclaringType`.
            DeclaringType = type.DeclaringType is not null && !type.IsGenericParameter ? new CSharpType(type.DeclaringType) : null;

            Arguments = arguments;
            IsNullable = isNullable;

            IsStruct = type.IsValueType;
            BaseType = type.BaseType ?? (CSharpType?)null;
            _underlyingType = type.IsEnum ? Enum.GetUnderlyingType(type) : null;
        }

        [Conditional("DEBUG")]
        private static void ValidateArguments(Type type, IReadOnlyList<CSharpType> arguments)
        {
            if (type.IsGenericTypeDefinition)
            {
                Debug.Assert(arguments.Count == type.GetGenericArguments().Length, $"the count of arguments given ({string.Join(", ", arguments.Select(a => a.ToString()))}) does not match the arguments in the definition {type}");
            }
            else
            {
                Debug.Assert(arguments.Count == 0, "arguments can be added only to the generic type definition.");
            }
        }

        internal CSharpType(
            TypeProvider implementation,
            string providerNamespace,
            IReadOnlyList<CSharpType> arguments,
            CSharpType? baseType)
            : this(
                  implementation.Name,
                  providerNamespace,
                  implementation is EnumProvider || implementation.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct),
                  false,
                  implementation.DeclaringTypeProvider?.Type,
                  arguments,
                  implementation.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public) && arguments.All(t => t.IsPublic),
                  implementation.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct),
                  baseType,
                  implementation.IsEnum? implementation.EnumUnderlyingType.FrameworkType : null)
        {
        }

        internal CSharpType(
            string name,
            string ns,
            bool isValueType,
            bool isNullable,
            CSharpType? declaringType,
            IReadOnlyList<CSharpType> args,
            bool isPublic,
            bool isStruct,
            CSharpType? baseType = null,
            Type? underlyingEnumType = null)
        {
            ArgumentNullException.ThrowIfNull(name, nameof(name));
            ArgumentNullException.ThrowIfNull(ns, nameof(ns));
            ArgumentNullException.ThrowIfNull(args, nameof(args));

            Arguments = args;
            Name = name;
            IsValueType = isValueType;
            IsNullable = isNullable;
            Namespace = ns;
            DeclaringType = declaringType;
            IsPublic = isPublic;
            IsStruct = isStruct;
            BaseType = baseType;
            _underlyingType = underlyingEnumType;
        }

        public string Namespace { get; private init; }
        public string Name { get; private init; }
        public CSharpType? DeclaringType { get; private init; }
        public bool IsValueType { get; private init; }
        public bool IsEnum => _underlyingType is not null;
        public bool IsLiteral => _literal is not null;
        public bool IsUnion => _unionItemTypes?.Count > 0;
        public bool IsPublic { get; private init; }
        public bool IsFrameworkType => _type != null;
        public bool IsNullable { get; private init; }
        public bool IsGenericType => Arguments.Count > 0;
        public bool IsCollection => _isCollection ??= TypeIsCollection();
        public IReadOnlyList<CSharpType> Arguments { get; private init; }
        public CSharpType? BaseType { get; }
        public bool IsStruct { get; private init; }
        public Type FrameworkType => _type ?? throw new InvalidOperationException("Not a framework type");
        public object Literal => _literal ?? throw new InvalidOperationException("Not a literal type");
        public Type UnderlyingEnumType => _underlyingType ?? throw new InvalidOperationException("Not an enum type");

        /// <summary>
        /// Retrieves the property initialization type variant of this type.
        /// For majority of the types, the return value of PropertyInitializationType should just be itself.
        /// For special cases like interface types, such as collections, this will return the concrete implementation type.
        /// </summary>
        public CSharpType PropertyInitializationType => _propertyInitializationType ??= GetPropertyInitializationType();
        public CSharpType ElementType => _elementType ??= GetElementType();
        public CSharpType InputType => _inputType ??= GetInputType();
        public CSharpType OutputType => _outputType ??= GetOutputType();
        public IReadOnlyList<CSharpType> UnionItemTypes => _unionItemTypes ?? throw new InvalidOperationException("Not a union type");

        private bool TypeIsReadOnlyMemory()
            => IsFrameworkType && _type == typeof(ReadOnlyMemory<>);

        private bool TypeIsReadOnlyList()
            => IsFrameworkType && (_type == typeof(IEnumerable<>) || _type == typeof(IReadOnlyList<>));

        private bool TypeIsReadWriteList()
            => IsFrameworkType && (_type == typeof(IList<>) || _type == typeof(ICollection<>) || _type == typeof(List<>));

        private bool TypeIsList()
            => IsReadOnlyList || IsReadWriteList || IsReadOnlyMemory;

        private bool TypeIsArray()
            => IsFrameworkType && FrameworkType.IsArray;

        private bool TypeIsReadOnlyDictionary()
            => IsFrameworkType && _type == typeof(IReadOnlyDictionary<,>);

        private bool TypeIsReadWriteDictionary()
            => IsFrameworkType && (_type == typeof(IDictionary<,>));

        private bool TypeIsDictionary()
            => IsReadOnlyDictionary || IsReadWriteDictionary;

        private bool TypeIsCollection()
            => IsFrameworkType && (IsDictionary || IsList);

        private bool TypeContainsBinaryData()
        {
            if (IsCollection)
            {
                return ElementType.TypeContainsBinaryData();
            }

            return IsFrameworkType && FrameworkType == typeof(BinaryData);
        }

        /// <summary>
        /// Retrieves the <see cref="CSharpType"/> initialization type with the <see cref="Arguments"/>.
        /// </summary>
        /// <returns>The implementation type <see cref="CSharpType"/>.</returns>
        private CSharpType GetPropertyInitializationType()
        {
            if (IsFrameworkType)
            {
                if (IsReadOnlyMemory)
                {
                    return new CSharpType(typeof(ReadOnlyMemory<>), Arguments);
                }

                if (IsList)
                {
                    return CodeModelPlugin.Instance.TypeFactory.ListInitializationType.MakeGenericType(Arguments);
                }

                if (IsDictionary)
                {
                    return CodeModelPlugin.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(Arguments);
                }
            }

            return this;
        }

        /// <summary>
        /// Retrieves the <see cref="CSharpType"/> element type for the <see cref="_type"/>. If the type is not an array, list, or dictionary, an exception is thrown.
        /// </summary>
        /// <returns>The <see cref="CSharpType"/> element type for the <see cref="_type"/>.</returns>
        /// <exception cref="NotSupportedException">Thrown when the type is not a framework type, array, list, or dictionary.</exception>
        private CSharpType GetElementType()
        {
            if (IsFrameworkType)
            {
                if (FrameworkType.IsArray)
                {
                    return new CSharpType(FrameworkType.GetElementType()!);
                }

                if (IsReadOnlyMemory || IsList)
                {
                    return Arguments[0];
                }

                if (IsDictionary)
                {
                    return Arguments[1];
                }
            }

            throw new NotSupportedException(Name);
        }

        /// <summary>
        /// Retrieves the <see cref="CSharpType"/> input type for the <see cref="_type"/>.
        /// </summary>
        /// <returns>The <see cref="CSharpType"/> input type.</returns>
        private CSharpType GetInputType()
        {
            if (IsFrameworkType)
            {
                if (IsReadOnlyMemory)
                {
                    return new CSharpType(typeof(ReadOnlyMemory<>), isNullable: IsNullable, arguments: Arguments);
                }

                if (IsList)
                {
                    return new CSharpType(
                        typeof(IEnumerable<>),
                        isNullable: IsNullable,
                        arguments: Arguments);
                }
            }

            return this;
        }

        /// <summary>
        /// Retrieves the <see cref="CSharpType"/> output type for the <see cref="_type"/>.
        /// </summary>
        /// <returns>The <see cref="CSharpType"/> output type.</returns>
        private CSharpType GetOutputType()
        {
            if (IsFrameworkType)
            {
                if (IsReadOnlyMemory)
                {
                    return new CSharpType(typeof(ReadOnlyMemory<>), isNullable: IsNullable, arguments: Arguments);
                }

                if (IsList)
                {
                    return new CSharpType(
                        typeof(IReadOnlyList<>),
                        isNullable: IsNullable,
                        arguments: Arguments);
                }

                if (IsDictionary)
                {
                    return new CSharpType(
                        typeof(IReadOnlyDictionary<,>),
                        isNullable: IsNullable,
                        arguments: Arguments);
                }
            }

            return this;
        }

        private bool TypeIsIEnumerableOfT() => IsFrameworkType && FrameworkType == typeof(IEnumerable<>);

        private bool TypeIsIAsyncEnumerableOfT() => IsFrameworkType && FrameworkType == typeof(IAsyncEnumerable<>);

        /// <summary>
        /// Types that the provided generic arguments match the type's arguments.
        /// </summary>
        /// <param name="genericArguments">The arguments to compare.</param>
        /// <returns><c>true</c> if the arguments are equal to the type's arguments. Otherwise, <c>false</c>.</returns>
        private bool AreArgumentsEqual(IReadOnlyList<Type> genericArguments)
        {
            if (Arguments.Count != genericArguments.Count)
            {
                return false;
            }

            for (int i = 0; i < Arguments.Count; i++)
            {
                if (!Arguments[i].Equals(genericArguments[i]))
                {
                    return false;
                }
            }

            return true;
        }

        internal bool TryGetCSharpFriendlyName([MaybeNullWhen(false)] out string name)
        {
            name = _type switch
            {
                null => null,
                var t when t.IsGenericParameter => t.Name,
                //if we have an array type and the element is defined in the same assembly then its a generic param array.
                var t when t.IsArray && t.Assembly.Equals(GetType().Assembly) => t.Name,
                var t when t == typeof(bool) => "bool",
                var t when t == typeof(byte) => "byte",
                var t when t == typeof(sbyte) => "sbyte",
                var t when t == typeof(short) => "short",
                var t when t == typeof(ushort) => "ushort",
                var t when t == typeof(int) => "int",
                var t when t == typeof(uint) => "uint",
                var t when t == typeof(long) => "long",
                var t when t == typeof(ulong) => "ulong",
                var t when t == typeof(char) => "char",
                var t when t == typeof(double) => "double",
                var t when t == typeof(float) => "float",
                var t when t == typeof(object) => "object",
                var t when t == typeof(decimal) => "decimal",
                var t when t == typeof(string) => "string",
                _ => null
            };

            return name != null;
        }

        /// <summary>
        /// Method checks if object of "<c>from</c>" type can be converted to "<c>to</c>" type by calling `ToList` extension method.
        /// It returns true if "<c>from</c>" is <see cref="IEnumerable{T}"/> and "<c>to</c>" is <see cref="IReadOnlyList{T}"/> or <see cref="IList{T}"/>.
        /// </summary>
        public static bool RequiresToList(CSharpType from, CSharpType to)
        {
            if (!to.IsFrameworkType || !from.IsFrameworkType || from.FrameworkType != typeof(IEnumerable<>))
            {
                return false;
            }

            return to.FrameworkType == typeof(IReadOnlyList<>) || to.FrameworkType == typeof(IList<>);
        }

        /// <summary>
        /// Validates if the current type is equal to <paramref name="other"/>.
        /// </summary>
        /// <param name="other">The type to compare.</param>
        /// <param name="ignoreNullable">Flag used to control if nullability should be ignored during comparison.</param>
        /// <returns><c>true</c> if the types are equal, <c>false</c> otherwise.</returns>
        protected internal bool Equals(CSharpType other, bool ignoreNullable = false)
            => Name == other.Name &&
                Namespace == other.Namespace &&
                IsValueType == other.IsValueType &&
                _type == other._type &&
                Arguments.SequenceEqual(other.Arguments) &&
                IsEnum == other.IsEnum &&
                IsStruct == other.IsStruct &&
                IsPublic == other.IsPublic &&
                _underlyingType == other._underlyingType &&
                (ignoreNullable || IsNullable == other.IsNullable);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public sealed override bool Equals(object? obj)
        {
            if (ReferenceEquals(null, obj))
                return false;
            if (ReferenceEquals(this, obj))
                return true;
            return obj is CSharpType csType && Equals(csType, ignoreNullable: false);
        }

        public bool Equals(Type type) =>
            IsFrameworkType && (type.IsGenericType ? type.GetGenericTypeDefinition() == FrameworkType && AreArgumentsEqual(type.GetGenericArguments()) : type == FrameworkType);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public sealed override int GetHashCode()
        {
            // we cache the hashcode since `CSharpType` is meant to be immutable.
            if (_hashCode != null)
                return _hashCode.Value;

            var hashCode = new HashCode();
            foreach (var arg in Arguments)
            {
                hashCode.Add(arg);
            }
            _hashCode = HashCode.Combine(Name, Namespace, IsValueType, _type, hashCode.ToHashCode(), IsNullable);

            return _hashCode.Value;
        }

        public CSharpType GetGenericTypeDefinition()
            => _type is null
                ? throw new NotSupportedException($"{nameof(TypeProvider)} doesn't support generics.")
                : new(_type, IsNullable);

        /// <summary>
        /// Constructs a new <see cref="CSharpType"/> with the given nullability <paramref name="isNullable"/>.
        /// </summary>
        /// <param name="isNullable">Flag to determine if the new type is nullable.</param>
        /// <returns>The existing <see cref="CSharpType"/> if it is nullable, otherwise a new instance of <see cref="CSharpType"/>.</returns>
        public CSharpType WithNullable(bool isNullable)
        {
            var type = isNullable == IsNullable ? this : IsFrameworkType
                ? new CSharpType(FrameworkType, Arguments, isNullable)
                : new CSharpType(Name, Namespace, IsValueType, isNullable, DeclaringType, Arguments, IsPublic, IsStruct, BaseType, _underlyingType);

            type._literal = _literal;
            type._unionItemTypes = _unionItemTypes;

            return type;
        }

        private static readonly Dictionary<Type, CSharpType> _cache = new();
        public static implicit operator CSharpType(Type type)
        {
            if (!_cache.TryGetValue(type, out var result))
            {
                result = new CSharpType(type);
                _cache[type] = result;
            }
            return result;
        }

        public sealed override string ToString()
        {
            using var writer = new CodeWriter();
            return writer.Append($"{this}").ToString(false);
        }

        /// <summary>
        /// Check whether two CSharpType instances equal or not
        /// This is not the same as left.Equals(right) because this function only checks the names.
        /// </summary>
        /// <param name="other">The instance to compare to.</param>
        /// <returns><c>true</c> if the instance are equal. <c>false</c> otherwise.</returns>
        public bool AreNamesEqual(CSharpType? other)
        {
            if (ReferenceEquals(this, other))
            {
                return true;
            }

            if (other is null)
            {
                return false;
            }

            if (Namespace != other.Namespace)
                return false;

            if (Name != other.Name)
                return false;

            if (Arguments.Count != other.Arguments.Count)
                return false;

            for (int i = 0; i < Arguments.Count; i++)
            {
                if (!Arguments[i].AreNamesEqual(other.Arguments[i]))
                    return false;
            }

            return true;
        }

        // TO-DO: Implement this once SystemObjectType is implemented: https://github.com/Azure/autorest.csharp/issues/4198
        // internal static CSharpType FromSystemType(Type type, string defaultNamespace, SourceInputModel? sourceInputModel, IEnumerable<ObjectTypeProperty>? backingProperties = null)
        // {
        //     var systemObjectType = SystemObjectType.Create(type, defaultNamespace, sourceInputModel, backingProperties);
        //     return systemObjectType.Type;
        // }

        // internal static CSharpType FromSystemType(BuildContext context, Type type, IEnumerable<ObjectTypeProperty>? backingProperties = null)
        //     => FromSystemType(type, context.DefaultNamespace, context.SourceInputModel, backingProperties);

        /// <summary>
        /// This function is used to create a new CSharpType instance with a literal value.
        /// If the type is a framework type, the CSharpType will be created with the literal value Constant
        /// object.
        /// </summary>
        /// <param name="type">The original type to create a new CSharpType instance from.</param>
        /// <param name="literalValue">The literal value of the type, if any.</param>
        /// <returns>An instance of CSharpType with a literal value property.</returns>
        public static CSharpType FromLiteral(CSharpType type, object literalValue)
        {
            if (type.IsFrameworkType)
            {
                var literalType = new CSharpType(type.FrameworkType, type.Arguments, type.IsNullable)
                {
                    _literal = literalValue
                };

                return literalType;
            }
            else if (type is { IsFrameworkType: false, IsEnum: true })
            {
                var literalType = new CSharpType(type.Name, type.Namespace, type.IsValueType, type.IsNullable, type.DeclaringType, type.Arguments, type.IsPublic, type.IsStruct, type.BaseType, type.IsFrameworkType && type.IsEnum ? Enum.GetUnderlyingType(type.FrameworkType) : type._underlyingType)
                {
                    _literal = literalValue
                };

                return literalType;
            }

            throw new NotSupportedException("Literals are not supported in non-framework type");
        }

        /// <summary>
        /// Constructs a CSharpType that represents a union type.
        /// </summary>
        /// <param name="unionItemTypes">The list of union item types.</param>
        /// <param name="isNullable">Flag used to determine if a type is nullable.</param>
        /// <returns>A <see cref="CSharpType"/> instance representing those unioned types.</returns>
        public static CSharpType FromUnion(IReadOnlyList<CSharpType> unionItemTypes, bool isNullable = false)
        {
            var type = new CSharpType(typeof(BinaryData), isNullable);
            type._unionItemTypes = unionItemTypes;

            return type;
        }

        public CSharpType MakeGenericType(IReadOnlyList<CSharpType> arguments)
        {
            if (IsFrameworkType)
            {
                return new CSharpType(FrameworkType, arguments, IsNullable);
            }
            else
            {
                return new CSharpType(Name, Namespace, IsValueType, IsNullable, DeclaringType, arguments, IsPublic, IsStruct);
            }
        }

        private CSharpType? _rootType;
        public CSharpType RootType => _rootType ??= GetRootType();

        private CSharpType GetRootType()
        {
            CSharpType returnType = this;
            while (returnType.BaseType != null)
            {
                returnType = returnType.BaseType;
            }

            return returnType;
        }
    }
}
