// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class FinallyStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = [];
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("finally");
            using (writer.Scope())
            {
                foreach (var statement in _body)
                {
                    statement.Write(writer);
                }
            }
        }

        public FinallyStatement Add(MethodBodyStatement statement)
        {
            _body.Add(statement);
            return this;
        }

        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();

        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();
    }
}
