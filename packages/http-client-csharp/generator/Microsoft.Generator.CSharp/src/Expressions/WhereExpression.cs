﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record WhereExpression(CSharpType Type, IReadOnlyList<ValueExpression> Constraints) : ValueExpression
    {
        public WhereExpression(CSharpType type, ValueExpression constraint) : this(type, new[] { constraint }) { }

        public WhereExpression And(ValueExpression constraint) => new(Type, new List<ValueExpression>(Constraints) { constraint });

        public override void Write(CodeWriter writer)
        {
            writer
                .AppendRaw("where ")
                .Append($"{Type} : ");
            foreach (var constraint in Constraints)
            {
                constraint.Write(writer);
                writer.AppendRaw(",");
            }
            writer.RemoveTrailingComma();
        }
    }
}
