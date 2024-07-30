// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
    /// </summary>
    internal partial class ExtensibleEnumSerializationProvider : TypeProvider
    {
        private readonly InputEnumType _enumType;
        private TypeProvider? _enumProvider;
        private TypeProvider EnumProvider => _enumProvider ??= ClientModelPlugin.Instance.TypeFactory.CreateEnum(_enumType);

        protected override string GetNamespace() => ClientModelPlugin.Instance.Configuration.ModelNamespace;

        public ExtensibleEnumSerializationProvider(InputEnumType enumType)
        {
            Debug.Assert(enumType.IsExtensible);
            _enumType = enumType;
        }

        protected override string BuildRelativeFilePath()
        {
            return Path.Combine("src", "Generated", "Models", $"{EnumProvider.Name}.Serialization.cs");
        }

        protected override string BuildName() => EnumProvider.Name;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => EnumProvider.DeclarationModifiers;

        protected override MethodProvider[] BuildMethods()
        {
            // for string-based extensible enums, we are using `ToString` as its serialization
            // for non-string-based extensible enums, we need a method to serialize them
            if (!EnumProvider.EnumUnderlyingType.Equals(typeof(string)))
            {
                var toSerialSignature = new MethodSignature(
                    Name: $"ToSerial{EnumProvider.EnumUnderlyingType.Name}",
                    Modifiers: MethodSignatureModifiers.Internal,
                    ReturnType: EnumProvider.EnumUnderlyingType,
                    Parameters: Array.Empty<ParameterProvider>(),
                    Description: null,
                    ReturnDescription: null);

                // writes the method:
                // internal float ToSerialSingle() => _value; // when ValueType is float
                // internal int ToSerialInt32() => _value; // when ValueType is int
                // etc
                var _valueField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, EnumProvider.EnumUnderlyingType, "_value");
                return [new MethodProvider(toSerialSignature, _valueField, this)];
            }
            else
            {
                return Array.Empty<MethodProvider>();
            }
        }
    }
}
