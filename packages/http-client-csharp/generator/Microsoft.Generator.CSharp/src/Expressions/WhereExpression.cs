// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record WhereExpression(CSharpType Type, IReadOnlyList<ValueExpression> Constraints) : ValueExpression
    {
        public WhereExpression(CSharpType type, ValueExpression constraint) : this(type, new[] { constraint }) { }

        public WhereExpression And(ValueExpression constraint) => new(Type, new List<ValueExpression>(Constraints) { constraint });

        internal override void Write(CodeWriter writer)
        {
            writer
                .AppendRaw("where ")
                .Append($"{Type} : ");
            for (int i = 0; i < Constraints.Count; i++)
            {
                Constraints[i].Write(writer);
                if (i < Constraints.Count - 1)
                    writer.AppendRaw(", ");
            }
        }
    }
}
