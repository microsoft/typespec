// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NewInstanceExpression(CSharpType? Type, IReadOnlyList<ValueExpression> Parameters, ObjectInitializerExpression? InitExpression = null) : ValueExpression
    {
        private const int SingleLineParameterThreshold = 6;

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"new");
            if (Type is not null)
            {
                using (var newInstanceScope = new CodeWriter.NewInstanceScope(writer))
                {
                    writer.Append($" {Type}");
                }
            }
            if (Parameters.Count > 0 || InitExpression is not { Values.Count: > 0 })
            {
                writer.WriteArguments(Parameters, Parameters.Count < SingleLineParameterThreshold);
            }

            if (InitExpression is not null)
            {
                if (!InitExpression.UseSingleLine)
                {
                    writer.WriteLine();
                }
                else
                {
                    writer.AppendRaw(" ");
                }
                InitExpression.Write(writer);
            }
        }
    }
}
