// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class ForeachStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        public CSharpType? ItemType { get; }
        public CodeWriterDeclaration Item { get; }
        public ValueExpression Enumerable { get; }
        public bool IsAsync { get; }

        public ForeachStatement(CSharpType? itemType, CodeWriterDeclaration item, ValueExpression enumerable, bool isAsync)
        {
            ItemType = itemType;
            Item = item;
            Enumerable = enumerable;
            IsAsync = isAsync;
        }

        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public ForeachStatement(CSharpType itemType, string itemName, ValueExpression enumerable, bool isAsync, out VariableExpression item)
            : this(itemType, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(itemType, Item);
        }

        public ForeachStatement(string itemName, EnumerableSnippet enumerable, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, false)
        {
            item = new VariableExpression(enumerable.ItemType, Item);
        }

        public ForeachStatement(string itemName, EnumerableSnippet enumerable, bool isAsync, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(enumerable.ItemType, Item);
        }

        public ForeachStatement(string itemName, DictionarySnippet dictionary, out KeyValuePairSnippet item)
            : this(null, new CodeWriterDeclaration(itemName), dictionary, false)
        {
            var variable = new VariableExpression(KeyValuePairSnippet.GetType(dictionary.KeyType, dictionary.ValueType), Item);
            item = new KeyValuePairSnippet(dictionary.KeyType, dictionary.ValueType, variable);
        }

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.AppendRawIf("await ", IsAsync);
                writer.AppendRaw("foreach (");
                if (ItemType == null)
                {
                    writer.AppendRaw("var ");
                }
                else
                {
                    writer.Append($"{ItemType} ");
                }

                writer.Append($"{Item:D} in ");
                Enumerable.Write(writer);
                writer.WriteRawLine(")");
                using (writer.Scope())
                {
                    foreach (var bodyStatement in Body)
                    {
                        bodyStatement.Write(writer);
                    }
                }
            }
        }
    }
}
