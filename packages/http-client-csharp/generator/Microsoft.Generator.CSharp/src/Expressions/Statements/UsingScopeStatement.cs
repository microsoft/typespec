// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record UsingScopeStatement(CSharpType? Type, CodeWriterDeclaration Variable, ValueExpression Value) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public UsingScopeStatement(CSharpType type, string variableName, ValueExpression value, out VariableReference variable) : this(type, new CodeWriterDeclaration(variableName), value)
        {
            variable = new VariableReference(type, Variable);
        }

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        public override void Write(CodeWriter writer)
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
