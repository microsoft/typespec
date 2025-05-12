// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
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

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodBodyStatement? parentStatement)
        {
            var expression = visitor.VisitMemberExpression(this, parentStatement);
            if (expression is not MemberExpression memberExpression)
            {
                return expression?.Accept(visitor, parentStatement);
            }

            var newInner = memberExpression.Inner?.Accept(visitor, parentStatement);
            if (ReferenceEquals(newInner, memberExpression.Inner))
            {
                return memberExpression;
            }

            return new MemberExpression(newInner, memberExpression.MemberName);
        }
    }
}
