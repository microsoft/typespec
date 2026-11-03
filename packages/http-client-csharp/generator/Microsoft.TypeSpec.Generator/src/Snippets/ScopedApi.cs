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
        public virtual bool Equals(ScopedApi? other) => other is not null && base.Equals(other) &&
            System.Collections.Generic.EqualityComparer<ValueExpression>.Default.Equals(Original, other.Original) &&
            System.Collections.Generic.EqualityComparer<CSharpType>.Default.Equals(Type, other.Type) &&
            System.Collections.Generic.EqualityComparer<MethodBodyStatement?>.Default.Equals(_terminated, other._terminated);

        public override int GetHashCode() => System.HashCode.Combine(base.GetHashCode(), Original, Type, _terminated);

        private long _declarationRevision;
        internal long DeclarationRevision => System.Threading.Volatile.Read(ref _declarationRevision);
        public ValueExpression Original { get; private set; }
        public CSharpType Type { get; private set; }

        public ScopedApi(CSharpType type, ValueExpression original)
            : base(original)
        {
            Original = original;
            Type = type;
        }

        private MethodBodyStatement? _terminated;

        internal override void WriteCore(CodeWriter writer)
        {
            Original.Write(writer);
        }

        protected internal override bool IsEmptyExpression() => Original.IsEmptyExpression();
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            System.Threading.Interlocked.Increment(ref _declarationRevision);
            var updatedExpression = visitor.VisitScopedApiExpression(this, method);

            if (updatedExpression is not ScopedApi scopedApi)
            {
                return updatedExpression?.Accept(visitor, method);
            }

            if (!ReferenceEquals(scopedApi, this))
            {
                System.Threading.Interlocked.Increment(ref scopedApi._declarationRevision);
            }

            scopedApi.Original = scopedApi.Original.Accept(visitor, method)!;

            return scopedApi;
        }

        public void Update(ValueExpression? original = null, CSharpType? type = null)
        {
            System.Threading.Interlocked.Increment(ref _declarationRevision);
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
