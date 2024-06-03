// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record UsingScopeStatement(CSharpType? Type, CodeWriterDeclaration Variable, ValueExpression Value) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public UsingScopeStatement(CSharpType type, string variableName, ValueExpression value, out VariableReferenceSnippet variable) : this(type, new CodeWriterDeclaration(variableName), value)
        {
            variable = new VariableReferenceSnippet(type, Variable);
        }

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.AppendRaw("using (");
                if (Type == null)
                {
                    writer.AppendRaw("var ");
                }
                else
                {
                    writer.Append($"{Type} ");
                }

                writer.Append($"{Variable:D} = ");
                Value.Write(writer);
                writer.WriteRawLine(")");

                writer.WriteRawLine("{");
                foreach (var bodyStatement in Body)
                {
                    bodyStatement.Write(writer);
                }
                writer.WriteRawLine("}");
            }
        }
    }
}
