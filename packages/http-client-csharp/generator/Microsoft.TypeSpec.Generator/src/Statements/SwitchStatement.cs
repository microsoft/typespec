// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class SwitchStatement : MethodBodyStatement
    {
        public ValueExpression MatchExpression { get; private set; }

        public SwitchStatement(ValueExpression matchExpression)
        {
            MatchExpression = matchExpression;
        }

        public SwitchStatement(ValueExpression matchExpression, IEnumerable<SwitchCaseStatement> cases) : this(matchExpression)
        {
            _cases.AddRange(cases);
        }

        private List<SwitchCaseStatement> _cases = new();
        public IReadOnlyList<SwitchCaseStatement> Cases => _cases;

        public void Add(SwitchCaseStatement statement) => _cases.Add(statement);

        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.Append($"switch (");
                MatchExpression.Write(writer);
                writer.WriteRawLine(")");
                using var scope = writer.Scope();
                foreach (var switchCase in Cases)
                {
                    switchCase.Write(writer);
                }
            }
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitSwitchStatement(this, method);

            if (updated is not SwitchStatement switchStatement)
            {
                return updated?.Accept(visitor, method);
            }

            var updatedCases = new List<SwitchCaseStatement>(switchStatement.Cases.Count);
            foreach (var switchCase in switchStatement.Cases)
            {
                var updatedCase = switchCase.Accept(visitor, method);
                if (updatedCase != null)
                {
                    updatedCases.Add(updatedCase);
                }
            }

            switchStatement._cases = updatedCases;
            return switchStatement;
        }

        public void Update(
            ValueExpression? matchExpression = null,
            IEnumerable<SwitchCaseStatement>? cases = null)
        {
            if (matchExpression != null)
            {
                MatchExpression = matchExpression;
            }

            if (cases != null)
            {
                _cases = cases.ToList();
            }
        }
    }
}
