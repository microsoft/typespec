// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputUnionType : InputType
    {
        public InputUnionType(string name, IReadOnlyList<InputType> unionItemTypes, bool isNullable) : base(name, isNullable)
        {
            UnionItemTypes = unionItemTypes;
        }

        public IReadOnlyList<InputType> UnionItemTypes { get; }

        internal IReadOnlyList<InputEnumTypeValue> GetEnum()
        {
            if (!IsAllLiteralStringPlusString())
                throw new InvalidOperationException($"Cannot convert union '{this}' to enum because its not all strings");

            var values = new List<InputEnumTypeValue>();
            foreach (var item in UnionItemTypes)
            {
                if (item is not InputLiteralType literalType)
                    continue;
                values.Add(new InputEnumTypeValue(FirstCharToUpperCase(literalType.Value.ToString()!), literalType.Value, literalType.Value.ToString()));
            }
            return values;
        }

        internal bool IsAllLiteralString()
        {
            foreach (var item in UnionItemTypes)
            {
                if (item is not InputLiteralType literal)
                    return false;

                if (literal.LiteralValueType is not InputPrimitiveType primitive)
                    return false;

                if (primitive.Kind != InputTypeKind.String)
                    return false;
            }

            return true;
        }

        internal bool IsAllLiteralStringPlusString()
        {
            foreach (var item in UnionItemTypes)
            {
                InputPrimitiveType? primitive = item is InputLiteralType literal ? literal.LiteralValueType as InputPrimitiveType : item as InputPrimitiveType;
                if (primitive is null)
                    return false;
                if (primitive.Kind != InputTypeKind.String)
                    return false;
            }

            return true;
        }

        private static string FirstCharToUpperCase(string str)
        {
            if (string.IsNullOrEmpty(str) || char.IsUpper(str[0]))
                return str;

            return char.ToUpper(str[0]) + str.Substring(1);
        }
    }
}
