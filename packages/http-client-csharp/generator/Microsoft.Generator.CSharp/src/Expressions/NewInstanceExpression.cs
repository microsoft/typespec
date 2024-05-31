// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NewInstanceExpression(CSharpType Type, IReadOnlyList<ValueExpression> Parameters, ObjectInitializerExpression? InitExpression = null) : ValueExpression
    {
        private const int SingleLineParameterThreshold = 6;

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"new {Type}");
            if (Parameters.Count > 0 || InitExpression is not { Parameters.Count: > 0 })
            {
                writer.WriteArguments(Parameters, Parameters.Count < SingleLineParameterThreshold);
            }

            if (InitExpression is { Parameters.Count: > 0 })
            {
                InitExpression.Write(writer);
            }
        }
    }
}
