// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record FuncExpression(IReadOnlyList<CodeWriterDeclaration?> Parameters, ValueExpression Inner) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
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
                            writer.AppendRaw(", ");
                    }
                    writer.AppendRaw(")");
                }

                writer.AppendRaw(" => ");
                Inner.Write(writer);
            }
        }
    }
}
