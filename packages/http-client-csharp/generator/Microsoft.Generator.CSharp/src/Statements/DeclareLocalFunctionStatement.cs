// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class DeclareLocalFunctionStatement : MethodBodyStatement
    {
        public CodeWriterDeclaration Name { get; }
        public IReadOnlyList<ParameterProvider> Parameters { get; }
        public CSharpType ReturnType { get; }
        public ValueExpression? BodyExpression { get; }
        public MethodBodyStatement? BodyStatement { get; }

        private DeclareLocalFunctionStatement(CodeWriterDeclaration name, IReadOnlyList<ParameterProvider> parameters, CSharpType returnType, ValueExpression? bodyExpression, MethodBodyStatement? bodyStatement)
        {
            Name = name;
            Parameters = parameters;
            ReturnType = returnType;
            BodyExpression = bodyExpression;
            BodyStatement = bodyStatement;
        }

        internal DeclareLocalFunctionStatement(CodeWriterDeclaration name, IReadOnlyList<ParameterProvider> parameters, CSharpType returnType, MethodBodyStatement bodyStatement)
            : this(name, parameters, returnType, null, bodyStatement) { }

        internal DeclareLocalFunctionStatement(CodeWriterDeclaration name, IReadOnlyList<ParameterProvider> parameters, CSharpType returnType, ValueExpression bodyExpression)
            : this(name, parameters, returnType, bodyExpression, null) { }

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
