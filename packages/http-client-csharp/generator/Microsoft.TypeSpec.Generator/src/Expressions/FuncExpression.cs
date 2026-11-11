// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record FuncExpression(IReadOnlyList<CodeWriterDeclaration?> Parameters, ValueExpression Inner) : ValueExpression
    {
        public MethodBodyStatement? BlockBody { get; init; }

        public FuncExpression(CodeWriterDeclaration?[] Parameters, ValueExpression Inner)
            : this((IReadOnlyList<CodeWriterDeclaration?>)Parameters, Inner) { }

        public FuncExpression(IReadOnlyList<CodeWriterDeclaration?> parameters, MethodBodyStatement blockBody)
            : this(parameters, ValueExpression.Empty) { BlockBody = blockBody; }

        public FuncExpression(CodeWriterDeclaration?[] parameters, MethodBodyStatement blockBody)
            : this((IReadOnlyList<CodeWriterDeclaration?>)parameters, blockBody) { }

        internal override void WriteCore(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                if (Parameters.Count == 1)
                {
                    var parameter = Parameters[0];
                    if (parameter is not null)
                    {
                        writer.WriteDeclaration(parameter);
                    }
                    else
                    {
                        writer.AppendRaw("_");
                    }
                }
                else
                {
                    writer.AppendRaw("(");
                    for (int i = 0; i < Parameters.Count; i++)
                    {
                        var parameter = Parameters[i];
                        if (parameter is not null)
                        {
                            writer.WriteDeclaration(parameter);
                        }
                        else
                        {
                            writer.AppendRaw("_");
                        }
                        if (i < Parameters.Count - 1)
                        {
                            writer.AppendRaw(", ");
                        }
                    }
                    writer.AppendRaw(")");
                }

                writer.AppendRaw(" => ");
                if (BlockBody is { } block)
                {
                    writer.WriteLine();
                    using (writer.Scope())
                    {
                        block.Write(writer);
                    }
                }
                else
                {
                    Inner.Write(writer);
                }
            }
        }
    }
}
