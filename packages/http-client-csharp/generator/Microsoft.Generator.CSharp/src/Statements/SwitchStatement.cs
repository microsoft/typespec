// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record SwitchStatement(ValueExpression MatchExpression) : MethodBodyStatement, IEnumerable<SwitchCaseStatement>
    {
        public SwitchStatement(ValueExpression matchExpression, IEnumerable<SwitchCaseStatement> cases) : this(matchExpression)
        {
            _cases.AddRange(cases);
        }

        private readonly List<SwitchCaseStatement> _cases = new();
        public IReadOnlyList<SwitchCaseStatement> Cases => _cases;

        public void Add(SwitchCaseStatement statement) => _cases.Add(statement);
        public IEnumerator<SwitchCaseStatement> GetEnumerator() => _cases.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_cases).GetEnumerator();

        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.Append($"switch (");
                MatchExpression.Write(writer);
                writer.WriteRawLine(")");
                writer.WriteRawLine("{");
                foreach (var switchCase in Cases)
                {
                    switchCase.Write(writer);
                }
                writer.WriteRawLine("}");
            }
        }
    }
}
