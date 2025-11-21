// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class IfElsePreprocessorStatement : MethodBodyStatement
    {
        public string Condition { get; }
        public MethodBodyStatement If { get; private set; }
        public MethodBodyStatement? Else { get; private set; }

        public IfElsePreprocessorStatement(string condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement = null)
        {
            Condition = condition;
            If = ifStatement;
            Else = elseStatement;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"#if {Condition}");
            If.Write(writer);
            if (Else is not null)
            {
                writer.WriteRawLine("#else");
                Else.Write(writer);
            }

            writer.WriteRawLine("#endif");
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitIfElsePreprocessorStatement(this, methodProvider);
            if (updated is not IfElsePreprocessorStatement updatedIfElseStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var updatedIf = updatedIfElseStatement.If.Accept(visitor, methodProvider);
            var updatedElse = updatedIfElseStatement.Else?.Accept(visitor, methodProvider);
            updatedIfElseStatement.If = updatedIf ?? throw new InvalidOperationException("If statement cannot be null.");
            updatedIfElseStatement.Else = updatedElse;
            return updatedIfElseStatement;
        }
    }
}
