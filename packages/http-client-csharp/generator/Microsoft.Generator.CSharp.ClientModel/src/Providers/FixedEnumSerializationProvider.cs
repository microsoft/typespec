// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
    /// </summary>
    internal class FixedEnumSerializationProvider : TypeProvider
    {
        private readonly InputEnumType _enumType;
        private TypeProvider? _enumProvider;
        private TypeProvider EnumProvider => _enumProvider ??= ClientModelPlugin.Instance.TypeFactory.CreateEnum(_enumType);

        public FixedEnumSerializationProvider(InputEnumType enumType)
        {
            Debug.Assert(!enumType.IsExtensible);
            _enumType = enumType;
        }

        protected override string GetNamespace() => ClientModelPlugin.Instance.Configuration.ModelNamespace;
        protected override TypeSignatureModifiers GetDeclarationModifiers() => (TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class);
        protected override string BuildRelativeFilePath()
        {
            return Path.Combine("src", "Generated", "Models", $"{_enumType.Name}.Serialization.cs");
        }

        protected override string BuildName() => $"{_enumType.Name}Extensions";

        /// <summary>
        /// Returns if this enum type needs an extension method for serialization
        /// </summary>
        /// <returns></returns>
        private bool NeedsSerializationMethod()
        {
            // fixed enum with int based types, we do not write a method for serialization because it was embedded in the definition
            bool isIntValueType = EnumProvider.EnumUnderlyingType.Equals(typeof(int)) || EnumProvider.EnumUnderlyingType.Equals(typeof(long));
            if (!_enumType.IsExtensible && isIntValueType)
                return false;

            // otherwise we need a serialization method with the name of `ToSerial{UnderlyingTypeName}`
            return true;
        }

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();
            // serialization method (in some cases we do not need serialization)
            if (NeedsSerializationMethod())
            {
                var serializationValueParameter = new ParameterProvider("value", $"The value to serialize.", EnumProvider.Type);
                var serializationSignature = new MethodSignature(
                    Name: $"ToSerial{EnumProvider.EnumUnderlyingType.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: EnumProvider.EnumUnderlyingType,
                    Parameters: [serializationValueParameter],
                    Description: null, ReturnDescription: null);

                // the fields of an enum type are the values of the enum type
                var knownCases = new SwitchCaseExpression[_enumType.Values.Count];
                for (int i = 0; i < knownCases.Length; i++)
                {
                    var enumValue = EnumProvider.EnumValues[i];
                    knownCases[i] = new SwitchCaseExpression(new MemberExpression(EnumProvider.Type, enumValue.Field.Name), Literal(enumValue.Value));
                }
                var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(EnumProvider, serializationValueParameter)));
                var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                methods.Add(new(serializationSignature, serializationBody, this));
            }

            // deserialization method (we always need a deserialization)
            var deserializationValueParameter = new ParameterProvider("value", $"The value to deserialize.", EnumProvider.EnumUnderlyingType);
            var deserializationSignature = new MethodSignature(
                Name: $"To{_enumType.Name}",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                ReturnType: EnumProvider.Type,
                Parameters: [deserializationValueParameter],
                Description: null, ReturnDescription: null);

            var value = (ValueExpression)deserializationValueParameter;
            var stringComparer = new MemberExpression(typeof(StringComparer), nameof(StringComparer.OrdinalIgnoreCase));
            var deserializationBody = new List<MethodBodyStatement>();

            // in general, this loop builds up if statements for each value, it looks like:
            // if (<condition>) { return EnumType.TheValue; }
            // the condition could be different depending on the type of the underlying value type of the enum
            for (int i = 0; i < EnumProvider.Fields.Count; i++)
            {
                var enumField = EnumProvider.Fields[i];
                var enumValue = EnumProvider.EnumValues[i];
                ScopedApi<bool> condition;
                if (EnumProvider.EnumUnderlyingType.Equals(typeof(string)))
                {
                    // when the values are strings, we compare them case-insensitively
                    // this is either
                    // StringComparer.OrdinalIgnoreCase.Equals(value, "<the value>")
                    // or
                    // string.Equals(value, "<the value>", StringComparison.InvariantCultureIgnoreCase)
                    condition = (enumValue.Value is string strValue && strValue.All(char.IsAscii)
                                ? stringComparer.Invoke(nameof(IEqualityComparer<string>.Equals), value, Literal(strValue))
                                : Static(EnumProvider.EnumUnderlyingType).Invoke(nameof(Equals), [value, Literal(enumValue.Value), FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)]))
                                .As<bool>();
                }
                else
                {
                    // when the values are not strings (it should be numbers), we just compare them using `==` operator, like `value == <the value>`
                    condition = value.Equal(Literal(enumValue.Value));
                }
                deserializationBody.Add(new IfStatement(condition)
                    {
                        Return(new MemberExpression(EnumProvider.Type, enumField.Name))
                    });
            }

            // add a fallback throw statement to ensure every path of this method returns a value
            deserializationBody.Add(Throw(New.ArgumentOutOfRangeException(EnumProvider, deserializationValueParameter)));

            methods.Add(new(deserializationSignature, deserializationBody, this));

            return methods.ToArray();
        }
    }
}
