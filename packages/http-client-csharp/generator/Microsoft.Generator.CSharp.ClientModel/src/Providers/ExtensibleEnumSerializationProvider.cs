// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
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
        private readonly EnumProvider _enumType;

        public ExtensibleEnumSerializationProvider(EnumProvider enumType)
        {
            Debug.Assert(enumType.IsExtensible);

            _enumType = enumType;
            Name = $"{_enumType.Name}";
        }

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");

        public override string Name { get; }

        public ValueExpression ToSerial(ValueExpression enumExpression)
        {
            var serialMethodName = _enumType.ValueType.Equals(typeof(string)) ? nameof(object.ToString) : $"ToSerial{_enumType.ValueType.Name}";
            return enumExpression.Invoke(serialMethodName);
        }

        public ValueExpression ToEnum(ValueExpression valueExpression)
            => New.Instance(Type, valueExpression);

        protected override MethodProvider[] BuildMethods()
        {
            // for string-based extensible enums, we are using `ToString` as its serialization
            // for non-string-based extensible enums, we need a method to serialize them
            if (!_enumType.ValueType.Equals(typeof(string)))
            {
                var toSerialSignature = new MethodSignature(
                    Name: $"ToSerial{_enumType.ValueType.Name}",
                    Modifiers: MethodSignatureModifiers.Internal,
                    ReturnType: _enumType.ValueType,
                    Parameters: Array.Empty<ParameterProvider>(),
                    Description: null,
                    ReturnDescription: null);

                // writes the method:
                // internal float ToSerialSingle() => _value; // when ValueType is float
                // internal int ToSerialInt32() => _value; // when ValueType is int
                // etc
                var _valueField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, _enumType.ValueType, "_value");
                return [new MethodProvider(toSerialSignature, _valueField, this)];
            }
            else
            {
                return Array.Empty<MethodProvider>();
            }
        }
    }
}
