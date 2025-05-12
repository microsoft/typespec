// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class TryStatement : MethodBodyStatement
    {
        private readonly List<MethodBodyStatement> _body = [];
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("try");
            using (writer.Scope())
            {
                foreach (var statement in Body)
                {
                    statement.Write(writer);
                }
            }
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitTryStatement(this, methodProvider);

            if (updated is not TryStatement updatedTryStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var newBody = new List<MethodBodyStatement>(_body.Count);
            bool hasChanges = false;
            foreach (var statement in updatedTryStatement.Body)
            {
                var updatedStatement = statement.Accept(visitor, methodProvider);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                    if (!ReferenceEquals(updatedStatement, statement))
                    {
                        hasChanges = true;
                    }
                }
            }
            if (!hasChanges && newBody.Count == _body.Count)
            {
                return updated;
            }

            return new TryStatement
            {
                newBody
            };
        }

        public TryStatement Add(MethodBodyStatement statement)
        {
            _body.Add(statement);
            return this;
        }
    }
}
