// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record MemberExpression(ValueExpression? Inner, string MemberName) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            if (Inner is not null)
            {
                Inner.Write(writer);
                writer.AppendRaw(".");
            }
            // workaround to avoid Roslyn reducing properties named Object to object
            // Should come up with a better approach - https://github.com/microsoft/typespec/issues/4724
            writer.AppendRaw(MemberName == "Object" && Inner == null ? $"this.{MemberName}" : MemberName);
        }
    }
}
