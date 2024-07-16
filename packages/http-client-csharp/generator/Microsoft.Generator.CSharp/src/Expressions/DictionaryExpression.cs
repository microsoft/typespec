// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DictionaryExpression(KeyValuePairType KeyValuePair, ValueExpression Original) : ValueExpression(Original)
    {
        public CSharpType KeyType => KeyValuePair.KeyType;
        public CSharpType ValueType => KeyValuePair.ValueType;

        public CSharpType Type { get; } = new(typeof(Dictionary<,>), KeyValuePair.KeyType, KeyValuePair.ValueType);

        public DictionaryExpression(CSharpType dictionaryType, ValueExpression original)
            : this(new KeyValuePairType(CheckNewInstance(dictionaryType), dictionaryType.Arguments[1]), original)
        {
        }

        public DictionaryExpression(NewInstanceExpression newInstance)
            : this(new KeyValuePairType(CheckNewInstance(newInstance.Type), newInstance.Type!.Arguments[1]), newInstance)
        {
        }

        private static CSharpType CheckNewInstance(CSharpType? type)
        {
            if (type is null)
            {
                throw new ArgumentException("Dictionary must have a type.");
            }

            if (type.Arguments.Count != 2)
            {
                throw new ArgumentException("Dictionary must have two type arguments.");
            }

            return type.Arguments[0];
        }

        public MethodBodyStatement Add(ValueExpression key, ValueExpression value)
            => Invoke(nameof(Dictionary<object, object>.Add), [key, value]).Terminate();

        public MethodBodyStatement Add(ValueExpression pair)
            => Invoke(nameof(Dictionary<object, object>.Add), pair).Terminate();

        public ValueExpression this[ValueExpression key] => new IndexerExpression(this, key);

        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }
    }
}
