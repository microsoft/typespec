// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class ForEachStatement : MethodBodyStatement
    {
        public CSharpType? ItemType { get; private set; }
        public CodeWriterDeclaration Item { get; private set; }
        public ValueExpression Enumerable { get; private set; }
        public bool IsAsync { get; }

        public VariableExpression ItemVariable { get; private set; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private ForEachStatement(CSharpType? itemType, CodeWriterDeclaration item, ValueExpression enumerable, bool isAsync)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
            ItemType = itemType;
            Item = item;
            Enumerable = enumerable;
            IsAsync = isAsync;
        }

        private List<MethodBodyStatement> _body = new();
        public IList<MethodBodyStatement> Body => _body;

        public ForEachStatement(CSharpType itemType, string itemName, ValueExpression enumerable, bool isAsync, out VariableExpression item)
            : this(itemType, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(itemType, Item);
            ItemVariable = item;
        }

        public ForEachStatement(string itemName, ScopedApi enumerable, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, false)
        {
            item = new VariableExpression(enumerable.Type.Arguments[0], Item);
            ItemVariable = item;
        }

        public ForEachStatement(string itemName, ScopedApi enumerable, bool isAsync, out VariableExpression item)
            : this(null, new CodeWriterDeclaration(itemName), enumerable, isAsync)
        {
            item = new VariableExpression(enumerable.Type.Arguments[0], Item);
            ItemVariable = item;
        }

        public ForEachStatement(string itemName, DictionaryExpression dictionary, out KeyValuePairExpression item)
            : this(null, new CodeWriterDeclaration(itemName), dictionary, false)
        {
            var variable = new VariableExpression(dictionary.KeyValuePair, Item);
            item = new(dictionary.KeyValuePair, variable);
            ItemVariable = variable;
        }

        public static ForEachStatement Create<T>(string itemName, ScopedApi<IEnumerable<T>> enumerable, out ScopedApi<T> item)
        {
            var statement = new ForEachStatement(itemName, enumerable, out var variable);
            item = variable.As<T>();
            return statement;
        }

        public ForEachStatement Add(MethodBodyStatement statement)
        {
            _body.Add(statement);
            return this;
        }

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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitForEachStatement(this, method);

            if (updated is not ForEachStatement updatedForEach)
            {
                return updated?.Accept(visitor, method);
            }

            updatedForEach.ItemVariable = updatedForEach.ItemVariable.Accept(visitor, method);
            updatedForEach.Enumerable = updatedForEach.Enumerable.Accept(visitor, method)!;

            var newBody = new List<MethodBodyStatement>(_body.Count);
            foreach (var statement in updatedForEach.Body)
            {
                var updatedStatement = statement.Accept(visitor, method);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                }
            }

            updatedForEach._body = newBody;

            return updated;
        }

        public void Update(
            VariableExpression? itemVariable = null,
            ValueExpression? enumerable = null)
        {
            if (itemVariable != null)
            {
                ItemVariable = itemVariable;
            }
            if (enumerable != null)
            {
                Enumerable = enumerable;
            }
        }
    }
}
