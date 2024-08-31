// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.Snippets
{
    public record ScopedApi : ValueExpression
    {
        public ValueExpression Original { get; }
        public CSharpType Type { get; }

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
    }
}
