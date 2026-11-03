// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>A frozen edge occurrence. It is not a reduction decision or a selected-call proof.</summary>
    internal sealed class PreparedSourceOccurrence
    {
        internal SourceOccurrenceId Id { get; }
        internal object Producer { get; }
        internal bool EmissionBoundary { get; }
        internal bool IsOpaque { get; }
        internal string? UnavailableReason { get; }
        internal ImmutableArray<PreparedSourceOccurrence> Children { get; }
        internal SourcePolicyFacts IntrinsicSource { get; }
        internal ImmutableArray<SyntaxReference> OriginalDescriptors { get; }
        internal ImmutableArray<SourcePolicyFacts> OriginalSource { get; }
        internal DeclaredArgumentMap? DeclaredArguments { get; }
        internal DeclaredCallableContract? DeclaredCallable { get; }
        private readonly StructuredSourceShape _shape;
        private readonly bool _disableXmlDocs;
        private int _stale;

        private PreparedSourceOccurrence(SourceOccurrenceId id, object producer, bool boundary, Compilation compilation,
            bool disableXmlDocs, bool conditional, HashSet<object> ancestors, int depth)
        {
            Id = id;
            Producer = producer;
            EmissionBoundary = boundary;
            _disableXmlDocs = disableXmlDocs;
            _shape = StructuredSourceShape.Capture(producer, disableXmlDocs);
            IsOpaque = _shape.Opaque || depth >= 256 || !ancestors.Add(producer);
            UnavailableReason = IsOpaque ? _shape.UnavailableReason ?? "Cyclic or unsupported deep ownership graph." : null;
            IntrinsicSource = IsOpaque ? SourcePolicyFacts.Opaque(conditional) : SourcePolicyFacts.Structured(
                _shape.IntrinsicTokens, _shape.IntrinsicLineBreaks, _shape.HasDirectives, conditional, _shape.IntrinsicLayoutKnown);
            var references = ImmutableArray.CreateBuilder<SyntaxReference>();
            switch (producer)
            {
                case InvokeMethodExpression invocation:
                    DeclaredArguments = invocation.CaptureDeclaredArguments(compilation); break;
                case NewInstanceExpression creation:
                    DeclaredArguments = creation.CaptureDeclaredArguments(compilation); break;
                case ConstructorInitializer initializer:
                    DeclaredArguments = initializer.CaptureDeclaredArguments(compilation);
                    if (initializer.OriginalSource is { } source) { references.Add(source); }
                    break;
                case MethodProvider method: DeclaredCallable = DeclaredCallableContract.FromProvider(method, compilation); break;
                case ConstructorProvider constructor: DeclaredCallable = DeclaredCallableContract.FromProvider(constructor, compilation); break;
                case MethodSignatureBase signature: DeclaredCallable = DeclaredCallableContract.FromSignature(signature, compilation); break;
            }
            var callable = DeclaredCallable ?? DeclaredArguments?.Contract;
            if (callable is not null) { references.AddRange(callable.SourceDeclarations); }
            OriginalDescriptors = references.ToImmutable();
            // Original declarations are NOT proof of correspondence to emitted IR. Keep these facts
            // separate, including diagnostics/directives/hidden source even after explicit CAE overrides.
            OriginalSource = OriginalDescriptors.Select(r => SourcePolicyFacts.Original(r, compilation)).ToImmutableArray();
            if (IsOpaque)
            {
                Children = [];
            }
            else
            {
                Children = _shape.Children.Select(child => new PreparedSourceOccurrence(
                    id with { EdgePath = id.EdgePath + "/" + child.Role }, child.Producer, child.EmissionBoundary, compilation,
                    disableXmlDocs, conditional || producer is IfElsePreprocessorStatement, ancestors, depth + 1)).ToImmutableArray();
                ancestors.Remove(producer);
            }
        }

        internal static PreparedSourceOccurrence Capture(SourceOccurrenceId id, object producer, bool boundary,
            Compilation compilation, bool disableXmlDocs) => new(id, producer, boundary, compilation, disableXmlDocs,
                false, new HashSet<object>(ReferenceEqualityComparer.Instance), 0);

        internal bool IsCurrent()
        {
            if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
            var current = _shape.Matches(StructuredSourceShape.Capture(Producer, _disableXmlDocs)) &&
                (DeclaredCallable?.IsAvailable != true || DeclaredCallable.IsCurrent()) &&
                (DeclaredArguments?.IsAvailable != true || DeclaredArguments.IsCurrent()) && Children.All(c => c.IsCurrent());
            if (!current) { System.Threading.Interlocked.Exchange(ref _stale, 1); }
            return current;
        }

        internal IEnumerable<PreparedSourceOccurrence> DescendantsAndSelf()
        {
            yield return this;
            foreach (var child in Children)
            {
                foreach (var descendant in child.DescendantsAndSelf()) { yield return descendant; }
            }
        }
    }
}
