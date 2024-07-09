// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
    /// </summary>
    internal class ExtensibleEnumSerializationProvider : TypeProvider
    {
        private readonly EnumProvider _enumType;

        public ExtensibleEnumSerializationProvider(EnumProvider enumType)
        {
            Debug.Assert(enumType.IsExtensible);

            _enumType = enumType;
            Name = $"{_enumType.Name}Extensions";
        }

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        public override string Name { get; }

        public ValueExpression ToSerial(ValueExpression enumExpression)
        {
            var serialMethodName = _enumType.ValueType.Equals(typeof(string)) ? nameof(object.ToString) : $"ToSerial{_enumType.ValueType.Name}";
            return enumExpression.Invoke(serialMethodName);
        }

        public ValueExpression ToEnum(ValueExpression valueExpression)
            => New.Instance(Type, valueExpression);
    }
}
