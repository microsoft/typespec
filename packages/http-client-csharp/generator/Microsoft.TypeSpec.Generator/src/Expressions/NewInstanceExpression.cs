// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record NewInstanceExpression(CSharpType? Type, IReadOnlyList<ValueExpression> Parameters, ObjectInitializerExpression? InitExpression = null) : ValueExpression
    {
        public bool Equals(NewInstanceExpression? other) => other is not null && base.Equals(other) &&
            System.Collections.Generic.EqualityComparer<CSharpType?>.Default.Equals(Type, other.Type) &&
            System.Collections.Generic.EqualityComparer<IReadOnlyList<ValueExpression>>.Default.Equals(Parameters, other.Parameters) &&
            System.Collections.Generic.EqualityComparer<ObjectInitializerExpression?>.Default.Equals(InitExpression, other.InitExpression);

        public override int GetHashCode() => System.HashCode.Combine(base.GetHashCode(), Type, Parameters, InitExpression);

        public NewInstanceExpression(CSharpType? Type, ValueExpression[] Parameters, ObjectInitializerExpression? InitExpression = null)
            : this(Type, (IReadOnlyList<ValueExpression>)Parameters, InitExpression) { }

        private const int SingleLineParameterThreshold = 6;
        internal ConstructorSignature? ConstructorIntent { get; init; }
        internal ConstructorProvider? ConstructorProviderIntent { get; init; }
        private DeclaredArgumentMap? _declaredArguments;
        internal DeclaredArgumentMap? CachedDeclaredArguments => ReferenceEquals(_declaredArguments?.Producer, this) ? _declaredArguments : null;

        internal DeclaredArgumentMap CaptureDeclaredArguments(Compilation compilation)
        {
            var contract = ConstructorProviderIntent is { } provider ? DeclaredCallableContract.FromProvider(provider, compilation)
                : ConstructorIntent is { } signature ? DeclaredCallableContract.FromSignature(signature, compilation)
                : DeclaredCallableContract.Unavailable("No retained constructor declaration intent.");
            _declaredArguments = DeclaredArgumentMap.ForConstruction(this, contract);
            return _declaredArguments;
        }

        internal override void WriteCore(CodeWriter writer)
        {
            writer.Append($"new");
            if (Type is not null)
            {
                using (var newInstanceScope = new CodeWriter.NewInstanceScope(writer))
                {
                    writer.Append($" {Type}");
                }
            }
            if (Parameters.Count > 0 || InitExpression is not { Values.Count: > 0 })
            {
                writer.WriteArguments(Parameters, Parameters.Count < SingleLineParameterThreshold);
            }

            if (InitExpression is not null)
            {
                if (!InitExpression.UseSingleLine)
                {
                    writer.WriteLine();
                }
                else
                {
                    writer.AppendRaw(" ");
                }
                InitExpression.Write(writer);
            }
        }
    }
}
