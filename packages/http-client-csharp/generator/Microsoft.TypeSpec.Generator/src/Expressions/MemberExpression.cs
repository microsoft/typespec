// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record MemberExpression(ValueExpression? Inner, string MemberName) : ValueExpression
    {
        public ValueExpression? Inner { get; internal set; } = Inner;
        public string MemberName { get; private set; } = MemberName;
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

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var expression = visitor.VisitMemberExpression(this, method);
            if (expression is not MemberExpression memberExpression)
            {
                return expression?.Accept(visitor, method);
            }

            var newInner = memberExpression.Inner?.Accept(visitor, method);
            if (ReferenceEquals(newInner, memberExpression.Inner))
            {
                return memberExpression;
            }

            return new MemberExpression(newInner, memberExpression.MemberName);
        }

        public void Update(ValueExpression? inner, string memberName)
        {
            Inner = inner;
            MemberName = memberName;
        }
    }
}
