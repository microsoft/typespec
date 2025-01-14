// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class ForeachStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        public CSharpType? ItemType { get; }
        public CodeWriterDeclaration Item { get; }
        public ValueExpression Enumerable { get; }
        public bool IsAsync { get; }

        public VariableExpression ItemVariable { get; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private ForeachStatement(CSharpType? itemType, CodeWriterDeclaration item, ValueExpression enumerable, bool isAsync)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
            ItemType = itemType;
            Item = item;
            Enumerable = enumerable;
            IsAsync = isAsync;
        }

        private readonly List<MethodBodyStatement> _body = new();
        public IList<MethodBodyStatement> Body => _body;

        public ForeachStatement(CSharpType itemType, string itemName, ValueExpression enumerable, bool isAsync, out VariableExpression item)
            : this(itemType, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(itemType, Item);
            ItemVariable = item;
        }

        public ForeachStatement(string itemName, ScopedApi enumerable, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, false)
        {
            item = new VariableExpression(enumerable.Type.Arguments[0], Item);
            ItemVariable = item;
        }

        public ForeachStatement(string itemName, ScopedApi enumerable, bool isAsync, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(enumerable.Type.Arguments[0], Item);
            ItemVariable = item;
        }

        public ForeachStatement(string itemName, DictionaryExpression dictionary, out KeyValuePairExpression item)
            : this(null, new CodeWriterDeclaration(itemName), dictionary, false)
        {
            var variable = new VariableExpression(dictionary.KeyValuePair, Item);
            item = new(dictionary.KeyValuePair, variable);
            ItemVariable = variable;
        }

        public static ForeachStatement Create<T>(string itemName, ScopedApi<IEnumerable<T>> enumerable, out ScopedApi<T> item)
        {
            var statement = new ForeachStatement(itemName, enumerable, out var variable);
            item = variable.As<T>();
            return statement;
        }

        public ForeachStatement Add(MethodBodyStatement statement)
        {
            _body.Add(statement);
            return this;
        }

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
