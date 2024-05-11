// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeSerializationProvider : TypeProvider
    {
        private readonly EnumTypeProvider _enumType;

        public EnumTypeSerializationProvider(EnumTypeProvider enumType, SourceInputModel? sourceInputModel) : base(sourceInputModel)
        {
            // only fixed enum need this provider
            Debug.Assert(!enumType.IsExtensible);

            _enumType = enumType;
            Namespace = _enumType.Namespace;
            Name = $"{_enumType.Name}Extensions";
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial;
        }

        public override string Namespace { get; }

        public override string Name { get; }

        protected override CSharpMethod[] BuildMethods()
        {
            const string MethodKind = "Method";
            var methods = new List<CSharpMethod>();
            // serialization method
            if (!_enumType.IsIntValueType)
            {
                // when the value type of the enum is int, the serialization value has been embedded in the enum definition, such as
                // public enum Foo { A = 1, B = 2, C = 6 }
                // therefore we do not need serialization if the value type is int
                var serializationValueParameter = new Parameter("value", null, _enumType.Type, null, ValidationType.None, null);
                var serializationSignature = new MethodSignature(
                    Name: _enumType.SerializationMethodName,
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: _enumType.ValueType,
                    Parameters: [serializationValueParameter],
                    Summary: null, Description: null, ReturnDescription: null);

                // the fields of an enum type are the values of the enum type
                var knownCases = new SwitchCaseExpression[_enumType.Fields.Count];
                for (int i = 0; i < knownCases.Length; i++)
                {
                    var enumField = _enumType.Fields[i];
                    var enumValue = _enumType.Values[i];
                    knownCases[i] = new SwitchCaseExpression(new MemberExpression(_enumType.Type, enumField.Name), Literal(enumValue.Value));
                }
                var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(_enumType, serializationValueParameter)));
                var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                methods.Add(new(serializationSignature, serializationBody, MethodKind));
            }

            // deserialization method
            var deserializationValueParameter = new Parameter("value", null, _enumType.ValueType, null, ValidationType.None, null);
            var deserializationSignature = new MethodSignature(
                Name: _enumType.DeserializationMethodName,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                ReturnType: _enumType.Type,
                Parameters: [deserializationValueParameter],
                Summary: null, Description: null, ReturnDescription: null);

            var value = (ValueExpression)deserializationValueParameter;
            var stringComparer = new MemberExpression(typeof(StringComparer), nameof(StringComparer.OrdinalIgnoreCase));
            var deserializationBody = new List<MethodBodyStatement>();
            for (int i = 0; i < _enumType.Fields.Count; i++)
            {
                var enumField = _enumType.Fields[i];
                var enumValue = _enumType.Values[i];
                BoolExpression condition;
                if (_enumType.IsStringValueType)
                {
                    // when the values are strings, we compare them case-insensitively
                    condition = new(enumValue.Value is string strValue && strValue.All(char.IsAscii)
                                ? stringComparer.Invoke(nameof(IEqualityComparer<string>.Equals), value, Literal(strValue))
                                : new InvokeStaticMethodExpression(_enumType.ValueType, nameof(object.Equals), [value, Literal(enumValue.Value), FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)]));
                }
                else
                {
                    // when the values are not strings, we just compare them using `==` operator
                    condition = Equal(value, Literal(enumValue.Value));
                }
                deserializationBody.Add(new IfStatement(condition)
                {
                    Return(new MemberExpression(_enumType.Type, enumField.Name))
                });
            }

            // add a fallback throw statement to ensure every path of this method returns a value
            deserializationBody.Add(Throw(New.ArgumentOutOfRangeException(_enumType, deserializationValueParameter)));

            methods.Add(new(deserializationSignature, deserializationBody, MethodKind));

            return methods.ToArray();
        }
    }
}
