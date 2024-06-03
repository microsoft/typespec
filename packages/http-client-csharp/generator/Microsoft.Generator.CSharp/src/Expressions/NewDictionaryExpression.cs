// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NewDictionaryExpression(CSharpType Type, DictionaryInitializerExpression? Values = null) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.Append($"new {Type}");
            if (Values is { Values.Count: > 0 })
            {
                Values.Write(writer);
            }
            else
            {
                writer.AppendRaw("()");
            }
        }
    }
}
