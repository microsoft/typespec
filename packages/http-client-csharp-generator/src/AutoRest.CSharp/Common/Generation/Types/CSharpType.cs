// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Buffers;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Generation.Types
{
    internal class CSharpType
    {
        private readonly TypeProvider? _implementation;
        private readonly Type? _type;

        public CSharpType(Type type) : this(
            type.IsGenericType ? type.GetGenericTypeDefinition() : type,
            type.IsGenericType ? type.GetGenericArguments().Select(p => new CSharpType(p)).ToArray() : Array.Empty<CSharpType>())
        {
        }

        public CSharpType(Type type, bool isNullable) : this(
            type.IsGenericType ? type.GetGenericTypeDefinition() : type,
            isNullable,
            type.IsGenericType ? type.GetGenericArguments().Select(p => new CSharpType(p)).ToArray() : Array.Empty<CSharpType>())
        {
        }

        public CSharpType(Type type, params CSharpType[] arguments) : this(type, false, arguments as IReadOnlyList<CSharpType>)
        { }

        public CSharpType(Type type, IReadOnlyList<CSharpType> arguments) : this(type, false, arguments)
        { }

        public CSharpType(Type type, bool isNullable, params CSharpType[] arguments) : this(type, isNullable, arguments as IReadOnlyList<CSharpType>)
        {
        }

        public CSharpType(Type type, bool isNullable, IReadOnlyList<CSharpType> arguments)
        {
            Debug.Assert(type.Namespace != null, "type.Namespace != null");
            Debug.Assert(type.IsGenericTypeDefinition || arguments.Count == 0, "arguments can be added only to the generic type definition.");

            _type = type;

            Namespace = type.Namespace;
            Name = type.IsGenericType ? type.Name.Substring(0, type.Name.IndexOf('`')) : type.Name;
            IsNullable = isNullable;
            Arguments = arguments;
            IsValueType = type.IsValueType;
            IsEnum = type.IsEnum;
            IsPublic = type.IsPublic && arguments.All(t => t.IsPublic);
        }

        public CSharpType(TypeProvider implementation, bool isValueType = false, bool isEnum = false, bool isNullable = false, CSharpType[]? arguments = default)
            : this(implementation, implementation.Declaration.Namespace, implementation.Declaration.Name, isValueType, isEnum, isNullable, arguments)
        {
        }

        public CSharpType(TypeProvider implementation, string ns, string name, bool isValueType = false, bool isEnum = false, bool isNullable = false, CSharpType[]? arguments = default)
        {
            _implementation = implementation;
            Name = name;
            IsValueType = isValueType;
            IsEnum = isEnum;
            IsNullable = isNullable;
            Namespace = ns;
            if (arguments != null)
                Arguments = arguments;
            SerializeAs = _implementation?.SerializeAs;
            IsPublic = implementation.Declaration.Accessibility == "public"
                && Arguments.All(t => t.IsPublic);
        }

        public string Namespace { get; }
        public string Name { get; }
        public bool IsValueType { get; }
        public bool IsEnum { get; }
        public bool IsLiteral => Literal is not null;
        public Constant? Literal { get; private init; }
        public bool IsUnion => UnionItemTypes.Count > 0;
        public IReadOnlyList<CSharpType> UnionItemTypes { get; private init; } = Array.Empty<CSharpType>();
        public bool IsPublic { get; }
        public IReadOnlyList<CSharpType> Arguments { get; } = Array.Empty<CSharpType>();
        public bool IsFrameworkType => _type != null;
        public Type FrameworkType => _type ?? throw new InvalidOperationException("Not a framework type");
        public TypeProvider Implementation => _implementation ?? throw new InvalidOperationException($"Not implemented type: '{Namespace}.{Name}'");
        public bool IsNullable { get; }

        public Type? SerializeAs { get; init; }

        public bool HasParent => IsFrameworkType ? false : Implementation is ObjectType objectType ? objectType.Inherits is not null : false;

        protected bool Equals(CSharpType other, bool ignoreNullable)
            => Equals(_implementation, other._implementation) &&
               _type == other._type &&
               Arguments.SequenceEqual(other.Arguments) &&
               (ignoreNullable || IsNullable == other.IsNullable);

        public override bool Equals(object? obj)
        {
            if (ReferenceEquals(null, obj))
                return false;
            if (ReferenceEquals(this, obj))
                return true;
            return obj is CSharpType csType && Equals(csType, ignoreNullable: false);
        }

        public bool EqualsIgnoreNullable(CSharpType other) => Equals(other, ignoreNullable: true);

        public bool Equals(Type type) =>
            IsFrameworkType && (type.IsGenericType ? type.GetGenericTypeDefinition() == FrameworkType && ArgumentsEquals(type.GetGenericArguments()) : type == FrameworkType);

        private bool ArgumentsEquals(IReadOnlyList<Type> genericArguments)
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

        private int? _hashCode;

        public override int GetHashCode()
        {
            // we cache the hashcode since `CSharpType` is meant to be immuttable.
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

        public bool IsGenericType => Arguments.Count > 0;

        public CSharpType WithNullable(bool isNullable) =>
            isNullable == IsNullable ? this : IsFrameworkType
                ? new CSharpType(FrameworkType, isNullable, Arguments)
                : new CSharpType(Implementation, Namespace, Name, IsValueType, IsEnum, isNullable);

        public static implicit operator CSharpType(Type type) => new CSharpType(type);

        public override string ToString()
        {
            return new CodeWriter().Append($"{this}").ToString(false);
        }

        public bool TryGetCSharpFriendlyName([MaybeNullWhen(false)] out string name)
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

        internal static CSharpType FromSystemType(Type type, string defaultNamespace, SourceInputModel? sourceInputModel, IEnumerable<ObjectTypeProperty>? backingProperties = null)
        {
            var genericTypes = type.GetGenericArguments().Select(t => new CSharpType(t));
            var systemObjectType = SystemObjectType.Create(type, defaultNamespace, sourceInputModel, backingProperties);
            // TODO -- why we do not just return systemObjectType.Type here? because of the generic types?
            return new CSharpType(
                systemObjectType,
                type.Namespace ?? defaultNamespace,
                systemObjectType.Declaration.Name,
                type.IsValueType,
                type.IsEnum,
                false,
                genericTypes.ToArray());
        }

        /// <summary>
        /// This function is used to create a new CSharpType instance with a literal value.
        /// If the type is a framework type, the CSharpType will be created with the literal value Constant
        /// object.
        /// </summary>
        /// <param name="type">The original type to create a new CSharpType instance from.</param>
        /// <param name="literalValue">The literal value of the type, if any.</param>
        /// <returns>An instance of CSharpType with a literal value property.</returns>
        internal static CSharpType FromLiteral(CSharpType type, object literalValue)
        {
            if (type.IsFrameworkType)
            {
                Constant? literal;
                try
                {
                    literal = new Constant(literalValue, type);
                }
                catch
                {
                    literal = null;
                }

                type = new CSharpType(type.FrameworkType, type.IsNullable)
                {
                    Literal = literal
                };
            }

            return type;
        }

        /// <summary>
        /// Constructs a CSharpType that represents a union type.
        /// </summary>
        /// <param name="unionItemTypes">The list of union item types.</param>
        /// <param name="isNullable">Flag used to determine if a type is nullable.</param>
        /// <returns></returns>
        public static CSharpType FromUnion(IReadOnlyList<CSharpType> unionItemTypes, bool isNullable)
        {
            return new CSharpType(typeof(BinaryData), isNullable)
            {
                UnionItemTypes = unionItemTypes
            };
        }

        internal static CSharpType FromSystemType(BuildContext context, Type type, IEnumerable<ObjectTypeProperty>? backingProperties = null)
            => FromSystemType(type, context.DefaultNamespace, context.SourceInputModel, backingProperties);

        /// <summary>
        /// Check whether two CSharpType instances equal or not
        /// This is not the same as left.Equals(right) because this function only checks the names
        /// </summary>
        /// <param name="left"></param>
        /// <param name="other"></param>
        /// <returns></returns>
        public bool EqualsByName(CSharpType? other)
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
                if (!Arguments[i].EqualsByName(other.Arguments[i]))
                    return false;
            }

            return true;
        }

        public CSharpType MakeGenericType(IReadOnlyList<CSharpType> arguments)
        {
            if (IsFrameworkType)
            {
                return new CSharpType(FrameworkType, IsNullable, arguments);
            }
            else
            {
                return new CSharpType(Implementation, Namespace, Name, IsValueType, IsEnum, IsNullable, arguments.ToArray());
            }
        }
    }
}
