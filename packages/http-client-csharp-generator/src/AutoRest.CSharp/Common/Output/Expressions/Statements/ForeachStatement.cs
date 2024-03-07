// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record ForeachStatement(CSharpType? ItemType, CodeWriterDeclaration Item, ValueExpression Enumerable, bool IsAsync) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public ForeachStatement(CSharpType itemType, string itemName, ValueExpression enumerable, bool isAsync, out VariableReference item)
            : this(itemType, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableReference(itemType, Item);
        }

        public ForeachStatement(string itemName, EnumerableExpression enumerable, out TypedValueExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, false)
        {
            item = new VariableReference(enumerable.ItemType, Item);
        }

        public ForeachStatement(string itemName, EnumerableExpression enumerable, bool isAsync, out TypedValueExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableReference(enumerable.ItemType, Item);
        }

        public ForeachStatement(string itemName, DictionaryExpression dictionary, out KeyValuePairExpression item)
            : this(null, new CodeWriterDeclaration(itemName), dictionary, false)
        {
            var variable = new VariableReference(KeyValuePairExpression.GetType(dictionary.KeyType, dictionary.ValueType), Item);
            item = new KeyValuePairExpression(dictionary.KeyType, dictionary.ValueType, variable);
        }

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();
    }
}
