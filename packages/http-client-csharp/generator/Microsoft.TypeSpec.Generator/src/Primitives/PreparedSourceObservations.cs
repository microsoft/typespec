// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>File-owned analysis of frozen occurrences. No recapture, writing, binding or source-policy clearance.</summary>
    internal sealed class PreparedSourceObservations
    {
        private readonly Func<bool> _current;
        private readonly ImmutableDictionary<PreparedSourceOccurrence, PreparedOccurrenceObservations> _facts;
        private readonly ImmutableArray<Func<bool>> _dependencies;
        private int _stale;
        internal ImmutableArray<PreparedCallerLineSite> KnownImplicitCallerLineSites { get; }
        internal ImmutableArray<PreparedCallerLineSite> UnknownCallerLineSites { get; }
        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_current() && _dependencies.All(check => check())) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }
        internal PreparedOccurrenceObservations? GetCurrent(PreparedSourceOccurrence occurrence) => IsCurrent && _facts.TryGetValue(occurrence, out var facts) ? facts : null;

        internal PreparedSourceObservations(ImmutableArray<PreparedSourceOccurrence> roots, Func<bool> current)
        {
            _current = current;
            var facts = ImmutableDictionary.CreateBuilder<PreparedSourceOccurrence, PreparedOccurrenceObservations>(ReferenceEqualityComparer.Instance);
            var dependencies = ImmutableArray.CreateBuilder<Func<bool>>();
            var lines = ImmutableArray.CreateBuilder<PreparedCallerLineSite>();
            var unknownLines = ImmutableArray.CreateBuilder<PreparedCallerLineSite>();
            foreach (var root in roots) { Visit(root, [], []); }
            _facts = facts.ToImmutable();
            _dependencies = dependencies.ToImmutable();
            KnownImplicitCallerLineSites = lines.ToImmutable();
            UnknownCallerLineSites = unknownLines.ToImmutable();

            void Visit(PreparedSourceOccurrence node, ImmutableArray<PreparedSourceCapture> inherited, ImmutableArray<PreparedCaptureBarrier> barriers)
            {
                var knowledge = PreparedDirectCaptureKnowledge.NotApplicable;
                var captures = ImmutableArray.CreateBuilder<PreparedSourceCapture>();
                var ownBarriers = ImmutableArray.CreateBuilder<PreparedCaptureBarrier>();
                if (node.Producer is InvokeMethodExpression or NewInstanceExpression or ConstructorInitializer)
                {
                    var selected = node.CallProofs?.Selection;
                    var absence = node.CallProofs?.ObservationAbsence;
                    if (selected is not null)
                    {
                        dependencies.Add(() => selected.IsCurrent);
                        knowledge = PreparedDirectCaptureKnowledge.Known;
                        if (!CaptureArguments(node, selected.Arguments, captures))
                        {
                            captures.Clear();
                            knowledge = PreparedDirectCaptureKnowledge.Unavailable;
                        }
                        else
                        {
                            foreach (var parameter in selected.Arguments.Parameters)
                            {
                                if (parameter.Presence == DeclaredArgumentPresence.Omitted && parameter.Formal.HasCallerLineNumber)
                                { lines.Add(new(node.Id, parameter.Formal.Ordinal)); }
                            }
                        }
                        if (selected.Contract.Parameters.Any(p => p.IsInterpolatedStringHandler != false || p.HandlerForwarding.Length != 0))
                        { AddChildBarriers(PreparedCaptureBarrierKind.ImplicitOperation); unknownLines.Add(new(node.Id, null)); }
                    }
                    else if (absence is not null)
                    {
                        dependencies.Add(() => absence.IsCurrent);
                        knowledge = PreparedDirectCaptureKnowledge.Known;
                    }
                    else { knowledge = PreparedDirectCaptureKnowledge.Unavailable; }
                    if (knowledge == PreparedDirectCaptureKnowledge.Unavailable)
                    {
                        AddChildBarriers(PreparedCaptureBarrierKind.UnavailableCall);
                        unknownLines.Add(new(node.Id, null));
                    }
                }
                if (node.IsOpaque)
                {
                    ownBarriers.Add(new(node.Id, node.Id, PreparedCaptureBarrierKind.Opaque));
                    unknownLines.Add(new(node.Id, null));
                }
                else if (node.Producer is ForEachStatement or UsingScopeStatement)
                {
                    var role = node.Producer is ForEachStatement ? "/collection" : "/resource";
                    foreach (var child in node.Children.Where(c => c.Id.EdgePath == node.Id.EdgePath + role))
                    { ownBarriers.Add(new(node.Id, child.Id, PreparedCaptureBarrierKind.ImplicitOperation)); }
                    unknownLines.Add(new(node.Id, null));
                }
                else if (node.Producer is IfStatement or WhileStatement or DoWhileStatement)
                {
                    // Unknown truth/conversion operations concern the condition,
                    // not the unrelated body. Enclosing source captures still
                    // propagate into both regions through their exact edges.
                    foreach (var child in node.Children.Where(c => c.Id.EdgePath == node.Id.EdgePath + "/condition"))
                    { ownBarriers.Add(new(node.Id, child.Id, PreparedCaptureBarrierKind.ImplicitOperation)); }
                    unknownLines.Add(new(node.Id, null));
                }
                else if (node.Producer is IfElsePreprocessorStatement)
                {
                    ownBarriers.Add(new(node.Id, node.Id, PreparedCaptureBarrierKind.Configuration));
                    unknownLines.Add(new(node.Id, null));
                }
                else if (!IsAccountedFor(node.Producer))
                {
                    // Unsupported implicit families remain unknown; this never
                    // marks independent field or literal decisions unavailable.
                    ownBarriers.Add(new(node.Id, node.Id, PreparedCaptureBarrierKind.ImplicitOperation));
                    unknownLines.Add(new(node.Id, null));
                }
                var own = captures.ToImmutable();
                var ownUnknown = ownBarriers.ToImmutable();
                facts.Add(node, new(this, node, knowledge, own, inherited, ownUnknown, barriers));
                foreach (var child in node.Children)
                {
                    var nextCaptures = inherited.AddRange(own.Where(c => c.SuppliedArgumentRoot == child.Id));
                    var nextBarriers = barriers.AddRange(ownUnknown.Where(b => b.RegionRoot == node.Id || b.RegionRoot == child.Id));
                    Visit(child, nextCaptures, nextBarriers);
                }
                void AddChildBarriers(PreparedCaptureBarrierKind kind)
                {
                    foreach (var child in node.Children) { ownBarriers.Add(new(node.Id, child.Id, kind)); }
                }
            }
        }

        private static bool CaptureArguments(PreparedSourceOccurrence node, DeclaredArgumentMap map, ImmutableArray<PreparedSourceCapture>.Builder captures)
        {
            foreach (var observer in map.Parameters)
            {
                if (observer.Presence != DeclaredArgumentPresence.Omitted) { continue; }
                foreach (var ordinal in observer.Formal.CallerExpressionTargets)
                {
                    var input = map.Parameters.FirstOrDefault(p => p.Formal.Ordinal == ordinal);
                    if (input is null) { return false; }
                    if (input.Presence == DeclaredArgumentPresence.Omitted) { continue; }
                    if (input.EvaluationIndex is not int index || input.SuppliedExpression is null) { return false; }
                    var reducedReceiver = input.Presence == DeclaredArgumentPresence.ReducedReceiver && index == -1;
                    if (index < 0 && !reducedReceiver) { return false; }
                    var edge = reducedReceiver ? "/receiver" : $"/argument[{index}]";
                    var children = node.Children.Where(c => c.Id.EdgePath == node.Id.EdgePath + edge).ToArray();
                    if (children.Length != 1 || !ReferenceEquals(children[0].Producer, input.SuppliedExpression)) { return false; }
                    captures.Add(new(node.Id, observer.Formal.Ordinal, ordinal, children[0].Id));
                }
            }
            return true;
        }

        private static bool IsAccountedFor(object producer) => producer is InvokeMethodExpression or NewInstanceExpression or ConstructorInitializer or
            MethodProvider or ConstructorProvider or MethodSignatureBase or ParameterProvider or FieldProvider or PropertyProvider or TypeProvider or
            MethodBodyStatements or ExpressionStatement or IfElseStatement or FuncExpression or ScopedApi or LiteralExpression or VariableExpression or TypeOfExpression or
            TypeReferenceExpression or MemberExpression or CastExpression or ArgumentExpression or PositionalParameterReferenceExpression or KeywordExpression;

        internal enum PreparedDirectCaptureKnowledge { NotApplicable, Known, Unavailable }
        internal enum PreparedCaptureBarrierKind { UnavailableCall, Opaque, ImplicitOperation, Configuration }
        internal sealed record PreparedSourceCapture(SourceOccurrenceId Observer, int CaptureParameterOrdinal,
            int InputParameterOrdinal, SourceOccurrenceId SuppliedArgumentRoot);
        internal sealed record PreparedCaptureBarrier(SourceOccurrenceId Origin, SourceOccurrenceId RegionRoot, PreparedCaptureBarrierKind Kind);
        internal sealed record PreparedCallerLineSite(SourceOccurrenceId Observer, int? ParameterOrdinal);

        /// <summary>A held immutable description; IsCurrent must be checked. Never an edit permission.</summary>
        internal sealed class PreparedOccurrenceObservations
        {
            private readonly PreparedSourceObservations _owner;
            internal SourceOccurrenceId Occurrence { get; }
            internal PreparedDirectCaptureKnowledge DirectKnowledge { get; }
            internal ImmutableArray<PreparedSourceCapture> OwnCaptures { get; }
            internal ImmutableArray<PreparedSourceCapture> EnclosingCaptures { get; }
            internal ImmutableArray<PreparedCaptureBarrier> OwnBarriers { get; }
            internal ImmutableArray<PreparedCaptureBarrier> EnclosingBarriers { get; }
            internal bool IsCurrent => _owner.IsCurrent;
            internal PreparedOccurrenceObservations(PreparedSourceObservations owner, PreparedSourceOccurrence occurrence,
                PreparedDirectCaptureKnowledge knowledge, ImmutableArray<PreparedSourceCapture> own, ImmutableArray<PreparedSourceCapture> enclosing,
                ImmutableArray<PreparedCaptureBarrier> ownBarriers, ImmutableArray<PreparedCaptureBarrier> enclosingBarriers)
            {
                _owner = owner;
                Occurrence = occurrence.Id;
                DirectKnowledge = knowledge;
                OwnCaptures = own;
                EnclosingCaptures = enclosing;
                OwnBarriers = ownBarriers;
                EnclosingBarriers = enclosingBarriers;
            }
        }
    }
}
