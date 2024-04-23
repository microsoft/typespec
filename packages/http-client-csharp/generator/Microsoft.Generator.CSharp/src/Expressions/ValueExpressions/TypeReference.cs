// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TypeReference(CSharpType Type) : ValueExpression
    {
        public override void Write(CodeWriter writer)
        {
            writer.Append($"{Type}");
        }
    }
}
