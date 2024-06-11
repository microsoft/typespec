// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DictionaryInitializerExpression(IReadOnlyList<(ValueExpression Key, ValueExpression Value)>? Values = null) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            if (Values is not { Count: > 0 })
            {
                writer.AppendRaw("{}");
                return;
            }

            writer.WriteLine();
            writer.WriteRawLine("{");
            for (int i = 0; i < Values.Count; i++)
            {
                var (key, value) = Values[i];
                key.Write(writer);
                writer.AppendRaw(" = ");
                value.Write(writer);
                if (i < Values.Count - 1)
                    writer.WriteRawLine(",");
            }
            writer.WriteLine();
            writer.AppendRaw("}");
        }
    }
}
