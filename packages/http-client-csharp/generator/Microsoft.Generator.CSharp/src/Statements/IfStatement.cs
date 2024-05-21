﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record IfStatement(BoolExpression Condition, bool Inline = false, bool AddBraces = true) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        public override void Write(CodeWriter writer)
        {
            writer.AppendRaw("if (");
            Condition.Write(writer);

            if (Inline)
            {
                writer.AppendRaw(") ");
                using (writer.AmbientScope())
                {
                    Body.Write(writer);
                }
            }
            else
            {
                writer.WriteRawLine(")");
                using (AddBraces ? writer.Scope() : writer.AmbientScope())
                {
                    Body.Write(writer);
                }
            }
        }
    }
}
