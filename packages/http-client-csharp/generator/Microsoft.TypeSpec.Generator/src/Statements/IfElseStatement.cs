// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class IfElseStatement : MethodBodyStatement
    {
        public IfStatement If { get; private set; }
        public IReadOnlyList<IfStatement> ElseIfs { get; private set; }
        public MethodBodyStatement? Else { get; private set; }

        public IfElseStatement(IfStatement ifStatement, MethodBodyStatement? elseStatement)
        {
            If = ifStatement;
            Else = elseStatement;
            ElseIfs = [];
        }

        public IfElseStatement(IfStatement ifStatement, IEnumerable<IfStatement>? elseIfStatements, MethodBodyStatement? elseStatement)
        {
            If = ifStatement;
            ElseIfs = elseIfStatements?.ToList() ?? [];
            Else = elseStatement;
        }

        public IfElseStatement(ValueExpression condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement, bool inline = false, bool addBraces = true)
            : this(new IfStatement(condition, inline, addBraces) { ifStatement }, elseStatement) { }

        internal override void Write(CodeWriter writer)
        {
            If.Write(writer);

            foreach (var elseIf in ElseIfs)
            {
                writer.AppendRaw("else ");
                elseIf.Write(writer);
            }

            if (Else is not null)
            {
                writer.WriteLine($"else");
                using (writer.Scope())
                {
                    Else.Write(writer);
                }
            }
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitIfElseStatement(this, methodProvider);
            if (updated is not IfElseStatement updatedIfElseStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var newIf = updatedIfElseStatement.If.Accept(visitor, methodProvider);
            if (newIf is not IfStatement newIfStatement)
            {
                throw new InvalidOperationException("Expected an IfStatement.");
            }
            updatedIfElseStatement.If = newIfStatement;

            var newElseIfs = new List<IfStatement>();
            foreach (var elseIf in updatedIfElseStatement.ElseIfs)
            {
                var newElseIf = elseIf.Accept(visitor, methodProvider);
                if (newElseIf is not IfStatement newElseIfStatement)
                {
                    throw new InvalidOperationException("Expected an IfStatement.");
                }
                newElseIfs.Add(newElseIfStatement);
            }
            updatedIfElseStatement.ElseIfs = newElseIfs;

            updatedIfElseStatement.Else = updatedIfElseStatement.Else?.Accept(visitor, methodProvider);

            return updatedIfElseStatement;
        }

        public void Update(
            IfStatement? ifStatement = null,
            MethodBodyStatement? elseStatement = null,
            IEnumerable<IfStatement>? elseIfStatements = null)
        {
            if (ifStatement != null)
            {
                If = ifStatement;
            }
            if (elseIfStatements != null)
            {
                ElseIfs = [.. elseIfStatements];
            }
            if (elseStatement != null)
            {
                Else = elseStatement;
            }
        }
    }
}
