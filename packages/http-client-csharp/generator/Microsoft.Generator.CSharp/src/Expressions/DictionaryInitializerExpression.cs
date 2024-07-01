// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DictionaryInitializerExpression(IReadOnlyDictionary<ValueExpression, ValueExpression> Values) : ObjectInitializerExpression(Values)
    {
        internal override void Write(CodeWriter writer)
        {
            var enumerator = Values.GetEnumerator();
            if (!enumerator.MoveNext())
            {
                writer.AppendRaw("{ }");
                return;
            }
            using var scope = writer.Scope();
            WriteItem(writer, enumerator.Current);
            while (enumerator.MoveNext())
            {
                writer.WriteRawLine(",");
                WriteItem(writer, enumerator.Current);
            }
            writer.WriteLine();
        }

        private void WriteItem(CodeWriter writer, KeyValuePair<ValueExpression, ValueExpression> item)
        {
            writer.AppendRaw("{ ");
            item.Key.Write(writer);
            writer.AppendRaw(", ");
            item.Value.Write(writer);
            writer.AppendRaw(" }");
        }
    }
}
