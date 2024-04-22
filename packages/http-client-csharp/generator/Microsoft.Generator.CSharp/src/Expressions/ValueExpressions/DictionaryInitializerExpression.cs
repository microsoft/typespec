// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DictionaryInitializerExpression(IReadOnlyList<(ValueExpression Key, ValueExpression Value)>? Values = null) : InitializerExpression
    {
        public override void Write(CodeWriter writer)
        {
            if (Values is not { Count: > 0 })
            {
                writer.AppendRaw("{}");
                return;
            }

            writer.WriteLine();
            writer.WriteRawLine("{");
            foreach (var (key, value) in Values)
            {
                writer.AppendRaw("[");
                key.Write(writer);
                writer.AppendRaw("] = ");
                value.Write(writer);
                writer.WriteRawLine(",");
            }

            writer.RemoveTrailingComma();
            writer.WriteLine();
            writer.AppendRaw("}");
        }
    }
}
