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
    /// <summary>Emitted parameter correspondence in one audited method body, not a lexical binder.</summary>
    internal sealed class PreparedMethodParameterFrame
    {
        private readonly MethodProvider _method;
        private readonly long _revision;
        private readonly MethodSignature _signature;
        private readonly StructuredSourceShape _signatureShape;
        private readonly object _body;
        private readonly IReadOnlyList<ParameterProvider> _parameters;
        private readonly ImmutableArray<ParameterState> _states;
        private readonly ImmutableArray<(object Producer, StructuredSourceShape Shape)> _region;
        private int _stale;

        private PreparedMethodParameterFrame(MethodProvider method, object body, ImmutableArray<ParameterState> states,
            ImmutableArray<(object Producer, StructuredSourceShape Shape)> region)
        {
            _method = method;
            _revision = method.DeclarationRevision;
            _signature = method.Signature;
            _signatureShape = StructuredSourceShape.Capture(_signature, true);
            _body = body;
            _parameters = _signature.Parameters;
            _states = states;
            _region = region;
        }

        internal static PreparedMethodParameterFrame? TryCapture(MethodProvider method, object body)
        {
            if (!ReferenceEquals((object?)method.BodyStatements ?? method.BodyExpression, body) ||
                !ContractCollections.TryCopy(method.Signature.Parameters, out var parameters)) { return null; }
            var region = ImmutableArray.CreateBuilder<(object, StructuredSourceShape)>();
            if (!CaptureRegion(body, region, new HashSet<object>(ReferenceEqualityComparer.Instance), 0)) { return null; }
            var states = ImmutableArray.CreateBuilder<ParameterState>();
            foreach (var parameter in parameters)
            {
                if (parameter is null || !DeclaredTypeSnapshot.TryCapture(parameter.Type, out var type)) { return null; }
                states.Add(new(parameter, parameter.DeclarationRevision, parameter.Type, type!, parameter.EmittedDeclarationState, parameter.CachedVariableExpression));
            }
            return new(method, body, states.ToImmutable(), region.ToImmutable());
        }

        internal CSharpType? Resolve(VariableExpression variable)
        {
            if (variable.GetType() != typeof(VariableExpression) || !IsCurrent()) { return null; }
            ParameterState? match = null;
            foreach (var state in _states)
            {
                if (state.Carrier?.GetType() != typeof(VariableExpression) || !ReferenceEquals(state.Carrier.Declaration, variable.Declaration)) { continue; }
                if (match is not null || state.Parameter.IsRef || state.Parameter.IsOut || state.Parameter.IsIn) { return null; }
                match = state;
            }
            return match?.Type;
        }

        internal CSharpType? Resolve(ParameterProvider parameter, string emittedName)
        {
            if (!IsCurrent()) { return null; }
            var matches = _states.Where(s => ReferenceEquals(s.Parameter, parameter)).ToArray();
            if (matches.Length != 1 || parameter.IsRef || parameter.IsOut || parameter.IsIn ||
                matches[0].EmittedState.Name != emittedName || _states.Count(s => s.EmittedState.Name == emittedName) != 1) { return null; }
            return matches[0].Type;
        }

        internal bool IsCurrent()
        {
            if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
            var current = _method.DeclarationRevision == _revision && ReferenceEquals(_method.Signature, _signature) &&
                ReferenceEquals((object?)_method.BodyStatements ?? _method.BodyExpression, _body) &&
                ReferenceEquals(_signature.Parameters, _parameters) && ContractCollections.TryCopy(_parameters, out var parameters) &&
                parameters.Length == _states.Length && parameters.Where((p, i) => !ReferenceEquals(p, _states[i].Parameter)).Any() == false &&
                _signatureShape.Matches(StructuredSourceShape.Capture(_signature, true)) && _states.All(s => s.IsCurrent()) &&
                _region.All(r => r.Shape.Matches(StructuredSourceShape.Capture(r.Producer, true)));
            if (!current) { System.Threading.Interlocked.Exchange(ref _stale, 1); }
            return current;
        }

        private static bool CaptureRegion(object producer, ImmutableArray<(object, StructuredSourceShape)>.Builder region, HashSet<object> ancestors, int depth, bool returnPosition = false)
        {
            if (depth >= 32 || !ancestors.Add(producer) || !Allowed(producer, returnPosition)) { return false; }
            var shape = StructuredSourceShape.Capture(producer, true);
            if (shape.Opaque) { return false; }
            region.Add((producer, shape));
            foreach (var child in shape.Children)
            {
                if (!CaptureRegion(child.Producer, region, ancestors, depth + 1, producer.GetType() == typeof(ExpressionStatement))) { return false; }
            }
            ancestors.Remove(producer);
            return true;
        }

        private static bool Allowed(object producer, bool returnPosition) => producer switch
        {
            ScopedApi wrapper => PreparedCallProofs.IsTransparentWrapper(wrapper),
            FuncExpression closure => ContractCollections.TryCopy(closure.Parameters, out var parameters) && parameters.Length == 0,
            KeywordExpression keyword => keyword.GetType() == typeof(KeywordExpression) &&
                (keyword.Expression is null && keyword.Keyword is "null" or "default" || returnPosition && keyword.Keyword == "return" && keyword.Expression is not null),
            MemberExpression member => member.GetType() == typeof(MemberExpression) && member.Declaration is null,
            _ => producer.GetType() == typeof(MethodBodyStatements) || producer.GetType() == typeof(ExpressionStatement) ||
                producer.GetType() == typeof(IfStatement) || producer.GetType() == typeof(IfElseStatement) ||
                producer.GetType() == typeof(WhileStatement) || producer.GetType() == typeof(DoWhileStatement) ||
                producer.GetType() == typeof(VariableExpression) || producer.GetType() == typeof(TypeOfExpression) ||
                producer.GetType() == typeof(NewArrayExpression) || producer.GetType() == typeof(ArrayInitializerExpression) || producer.GetType() == typeof(IndexableExpression) ||
                producer.GetType() == typeof(TypeReferenceExpression) || producer.GetType() == typeof(InvokeMethodExpression) ||
                producer is LiteralExpression or CastExpression or NewInstanceExpression or ArgumentExpression or PositionalParameterReferenceExpression
        };

        private sealed record ParameterState(ParameterProvider Parameter, long Revision, CSharpType Type, DeclaredTypeSnapshot TypeSnapshot,
            (long Variable, long Declaration, string Name) EmittedState, VariableExpression? Carrier)
        {
            internal bool IsCurrent() => Parameter.DeclarationRevision == Revision && ReferenceEquals(Parameter.Type, Type) && TypeSnapshot.IsCurrent() &&
                Parameter.EmittedDeclarationState == EmittedState && (Carrier is null || ReferenceEquals(Parameter.CachedVariableExpression, Carrier));
        }
    }
}
