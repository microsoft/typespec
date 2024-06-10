// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<ParameterProvider> Parameters, CSharpType ReturnType, ValueExpression? BodyExpression, MethodBodyStatement? BodyStatement) : MethodBodyStatement
    {
        internal DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<ParameterProvider> Parameters, CSharpType ReturnType, MethodBodyStatement BodyStatement)
            : this(Name, Parameters, ReturnType, null, BodyStatement) { }

        internal DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<ParameterProvider> Parameters, CSharpType ReturnType, ValueExpression BodyExpression)
            : this(Name, Parameters, ReturnType, BodyExpression, null) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"{ReturnType} {Name:D}(");
            for (int i = 0; i < Parameters.Count; i++)
            {
                writer.Append($"{Parameters[i].Type} {Parameters[i].Name}, ");
                if (i < Parameters.Count - 1)
                    writer.AppendRaw(", ");
            }
            writer.AppendRaw(")");
            if (BodyExpression is not null)
            {
                writer.AppendRaw(" => ");
                BodyExpression.Write(writer);
                writer.WriteRawLine(";");
            }
            else if (BodyStatement is not null)
            {
                writer.WriteLine();
                using (writer.Scope())
                {
                    BodyStatement.Write(writer);
                }
            }
            else
            {
                throw new InvalidOperationException($"{nameof(DeclareLocalFunctionStatement)}.{nameof(BodyExpression)} and {nameof(DeclareLocalFunctionStatement)}.{nameof(BodyStatement)} can't both be null.");
            }
        }
    }
}
