// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// CSharpType represents the C# type of an input type.
    /// It is constructed from a <see cref="Type"/> and its properties.
    /// </summary>
    public class CSharpType
    {
        private readonly TypeProvider? _implementation;
        private readonly Type? _type;
        private string _name;
        private string _namespace;
        private CSharpType? _declaringType;
        private bool _isValueType;
        private bool _isEnum;
        private bool _isNullable;
        private bool _isPublic;
        private IReadOnlyList<CSharpType> _arguments;
        private object? _literal;
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
        private CSharpType? _initializationType;
        private CSharpType? _propertyInitializationType;
        private CSharpType? _elementType;
        private CSharpType? _inputType;
        private CSharpType? _outputType;
        internal bool IsReadOnlyMemory => _isReadOnlyMemory ??= TypeIsReadOnlyMemory();
        internal bool IsList => _isList ??= TypeIsList();
        internal bool IsArray => _isArray ??= TypeIsArray();
        internal bool IsReadOnlyList => _isReadOnlyList ??= TypeIsReadOnlyList();
        internal bool IsReadWriteList => _isReadWriteList ??= TypeIsReadWriteList();
        internal bool IsDictionary => _isDictionary ??= TypeIsDictionary();
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
            isNullable,
            type.IsGenericType ? type.GetGenericArguments().Select(p => new CSharpType(p)).ToArray() : Array.Empty<CSharpType>())
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

            _type = type.IsGenericType ? type.GetGenericTypeDefinition() : type;
            ValidateArguments(_type, arguments);

            var name = type.IsGenericType ? type.Name.Substring(0, type.Name.IndexOf('`')) : type.Name;
            var isValueType = type.IsValueType;
            var isEnum = type.IsEnum;
            var ns = type.Namespace;
            var isPublic = type.IsPublic && arguments.All(t => t.IsPublic);
            // open generic parameter such as the `T` in `List<T>` is considered as declared inside the `List<T>` type as well, but we just want this to be the pure nested type, therefore here we exclude the open generic parameter scenario
            // for a closed generic parameter such as the `string` in `List<string>`, it is just an ordinary type without a `DeclaringType`.
            var declaringType = type.DeclaringType is not null && !type.IsGenericParameter ? new CSharpType(type.DeclaringType) : null;

            Initialize(name, isValueType, isEnum, isNullable, ns, declaringType, arguments, isPublic);
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

        internal CSharpType(TypeProvider implementation, bool isValueType = false, bool isEnum = false, bool isNullable = false, IReadOnlyList<CSharpType>? arguments = null, CSharpType? declaringType = null, string? ns = null, string? name = null)
        {
            _implementation = implementation;
            _arguments = arguments ?? Array.Empty<CSharpType>();

            var isPublic = (implementation.DeclarationModifiers & TypeSignatureModifiers.Public) != 0
                && Arguments.All(t => t.IsPublic);

            Initialize(name, isValueType, isEnum, isNullable, ns, declaringType, arguments, isPublic);

            SerializeAs = _implementation?.SerializeAs;
        }

        [MemberNotNull(nameof(_name))]
        [MemberNotNull(nameof(_isValueType))]
        [MemberNotNull(nameof(_isEnum))]
        [MemberNotNull(nameof(_isNullable))]
        [MemberNotNull(nameof(_namespace))]
        [MemberNotNull(nameof(_arguments))]
        [MemberNotNull(nameof(_isPublic))]
        private void Initialize(string? name, bool isValueType, bool isEnum, bool isNullable, string? ns,
            CSharpType? declaringType, IReadOnlyList<CSharpType>? args, bool isPublic)
        {
            _name = name ?? string.Empty;
            _isValueType = isValueType;
            _isEnum = isEnum;
            _isNullable = isNullable;
            _namespace = ns ?? string.Empty;
            _declaringType = declaringType;
            _arguments = args ?? Array.Empty<CSharpType>();
            _isPublic = isPublic;
        }

        public string Namespace { get { return _namespace; } }
        public string Name { get { return _name; } }
        public CSharpType? DeclaringType { get { return _declaringType; } }
        public bool IsValueType { get { return _isValueType; } }
        public bool IsEnum { get { return _isEnum; } }
        public bool IsLiteral => _literal is not null;
        public bool IsUnion => _unionItemTypes?.Count > 0;
        public bool IsPublic { get { return _isPublic; } }
        public bool IsFrameworkType => _type != null;
        public bool IsNullable { get { return _isNullable; } }
        public bool IsGenericType => Arguments.Count > 0;
        public bool IsCollection => _isCollection ??= TypeIsCollection();
        public Type FrameworkType => _type ?? throw new InvalidOperationException("Not a framework type");
        public object Literal => _literal ?? throw new InvalidOperationException("Not a literal type");
        internal TypeProvider Implementation => _implementation ?? throw new InvalidOperationException($"Not implemented type: '{Namespace}.{Name}'");
        public IReadOnlyList<CSharpType> Arguments { get { return _arguments; } }
        public CSharpType InitializationType => _initializationType ??= GetImplementationType();
        public CSharpType PropertyInitializationType => _propertyInitializationType ??= GetPropertyImplementationType();
        public CSharpType ElementType => _elementType ??= GetElementType();
        public CSharpType InputType => _inputType ??= GetInputType();
        public CSharpType OutputType => _outputType ??= GetOutputType();
        public Type? SerializeAs { get; init; }
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
        /// Retrieves the <see cref="CSharpType"/> implementation type for the <see cref="_type"/>.
        /// </summary>
        /// <returns>The implementation type <see cref="CSharpType"/>.</returns>
        private CSharpType GetImplementationType()
        {
            if (IsFrameworkType)
            {
                if (IsReadOnlyMemory)
                {
                    return new CSharpType(Arguments[0].FrameworkType.MakeArrayType());
                }

                if (IsList)
                {
                    return new CSharpType(typeof(List<>), Arguments);
                }

                if (IsDictionary)
                {
                    return new CSharpType(typeof(Dictionary<,>), Arguments);
                }
            }

            return this;
        }

        /// <summary>
        /// Retrieves the <see cref="CSharpType"/> implementation type for the <see cref="_type"'s arguments/>.
        /// </summary>
        /// <returns>The implementation type <see cref="CSharpType"/>.</returns>
        private CSharpType GetPropertyImplementationType()
        {
            if (IsFrameworkType)
            {
                if (IsReadOnlyMemory)
                {
                    return new CSharpType(typeof(ReadOnlyMemory<>), Arguments);
                }

                if (IsList)
                {
                    return new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.ChangeTrackingListType, Arguments);
                }

                if (IsDictionary)
                {
                    return new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.ChangeTrackingDictionaryType, Arguments);
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
        internal static bool RequiresToList(CSharpType from, CSharpType to)
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
            => Equals(_implementation, other._implementation) &&
               _type == other._type &&
               Arguments.SequenceEqual(other.Arguments) &&
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
            _hashCode = HashCode.Combine(_implementation, _type, hashCode.ToHashCode(), IsNullable);

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
                : new CSharpType(Implementation, isValueType: IsValueType, isEnum: IsEnum, isNullable: isNullable, arguments: Arguments, declaringType: DeclaringType, ns: Namespace, name: Name);

            type._literal = _literal;
            type._unionItemTypes = _unionItemTypes;

            return type;
        }

        public static implicit operator CSharpType(Type type) => new CSharpType(type);

        public sealed override string ToString()
        {
            return new CodeWriter().Append($"{this}").ToString(false);
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
                var literalType = new CSharpType(type.FrameworkType, type.IsNullable);
                literalType._literal = literalValue;

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
        public static CSharpType FromUnion(IReadOnlyList<CSharpType> unionItemTypes, bool isNullable)
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
                return new CSharpType(Implementation, isValueType: IsValueType, isEnum: IsEnum, isNullable: IsNullable, arguments: Arguments, declaringType: DeclaringType, ns: Namespace, name: Name);
            }
        }
    }
}
