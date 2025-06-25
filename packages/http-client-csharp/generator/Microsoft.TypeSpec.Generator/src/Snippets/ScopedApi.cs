// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public record ScopedApi : ValueExpression
    {
        public ValueExpression Original { get; private set; }
        public CSharpType Type { get; private set; }

        public ScopedApi(CSharpType type, ValueExpression original)
            : base(original)
        {
            Original = original;
            Type = type;
        }

        private MethodBodyStatement? _terminated;

        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }

        protected internal override bool IsEmptyExpression() => Original.IsEmptyExpression();
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updatedExpression = visitor.VisitScopedApiExpression(this, method);

            if (updatedExpression is not ScopedApi scopedApi)
            {
                return updatedExpression?.Accept(visitor, method);
            }

            scopedApi.Original = scopedApi.Original.Accept(visitor, method)!;

            return scopedApi;
        }

        public void Update(ValueExpression? original = null, CSharpType? type = null)
        {
            if (original != null)
            {
                Original = original;
            }

            if (type != null)
            {
                Type = type;
            }
        }
    }
}
