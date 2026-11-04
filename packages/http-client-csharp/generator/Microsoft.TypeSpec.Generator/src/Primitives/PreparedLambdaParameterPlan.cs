// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Contextual declaration evidence before child capture. This does not select
    /// a call, prove applicability, or grant source-edit permission.
    /// </summary>
    internal sealed class PreparedLambdaParameterPlan
    {
        private readonly MethodProvider _method;
        private readonly long _revision;
        private readonly StructuredSourceShape _methodShape;
        private readonly PreparedGeneratedTypeHeader _header;
        private readonly PreparedGeneratedDocumentationEnvelope _docs;
        private readonly DeclaredCallableContract _contract;
        private readonly DeclaredArgumentMap _map;
        private readonly Func<bool> _environmentCurrent;
        private readonly CSharpCompilation _compilation;
        private readonly CodeModelGenerator _generator;
        private readonly List<(object Node, StructuredSourceShape Shape)> _nodes = [];
        private readonly Dictionary<CodeWriterDeclaration, FuncExpression> _binders = new(ReferenceEqualityComparer.Instance);
        private readonly List<Frame> _frames = [];
        private int _stale;

        private PreparedLambdaParameterPlan(MethodProvider method, PreparedGeneratedTypeHeader header, PreparedGeneratedDocumentationEnvelope docs,
            DeclaredCallableContract contract, DeclaredArgumentMap map, Func<bool> environmentCurrent, CSharpCompilation compilation)
        {
            _method = method; _revision = method.DeclarationRevision; _methodShape = StructuredSourceShape.Capture(method, true);
            _header = header; _docs = docs; _contract = contract; _map = map; _environmentCurrent = environmentCurrent;
            _compilation = compilation; _generator = CodeModelGenerator.Instance;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                // No parent occurrence/selection/child facts here: children consume
                // this context while their parent's construction is unfinished.
                if (_environmentCurrent() && ReferenceEquals(_generator, CodeModelGenerator.Instance) &&
                    _method.DeclarationRevision == _revision && _methodShape.Matches(StructuredSourceShape.Capture(_method, true)) &&
                    _header.IsCurrent && _docs.IsCurrent && _contract.IsCurrent() && _map.IsCurrent() &&
                    PreparedGeneratedMethodGroup.HasSafeContextSignature(_method, _compilation) &&
                    _nodes.All(n => n.Shape.Matches(StructuredSourceShape.Capture(n.Node, true)))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        internal static PreparedLambdaParameterPlan? TryCapture(MethodProvider method, object body, SourceOccurrenceId id, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?>? resolveType, Func<bool>? environmentCurrent)
        {
            if (environmentCurrent is null || compilation is not CSharpCompilation csharp || method.BodyStatements is not null ||
                !ReferenceEquals(method.BodyExpression, body) || body is not InvokeMethodExpression invocation || !CodeWriter.HasMethodDeclaration(method) ||
                method.Signature.GenericArguments is not null || method.Signature.ExplicitInterface is not null || method.Signature.NonDocumentComment is not null ||
                (method.Signature.Modifiers & ~(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static)) != 0 ||
                !ContractCollections.TryCopy(method.Signature.Attributes, out var attributes) || !attributes.IsEmpty ||
                !PreparedGeneratedMethodGroup.HasSafeContextSignature(method, csharp)) { return null; }
            var owner = method.EnclosingType;
            if (PreparedGeneratedTypeHeader.TryCapture(owner) is not { } header ||
                PreparedGeneratedDocumentationEnvelope.TryCapture(method.XmlDocs) is not { } docs ||
                !PreparedCallImportScope.HasPureFormattedTypes(header.ImportTypes.Concat(docs.ImportTypes)) ||
                owner.PartialDeclarationOwner is not null || !owner.PartialDeclarationParts.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedMethods, out var methods) || methods.Length != 1 || !ReferenceEquals(methods[0], method) ||
                !Empty(owner.CachedFields) || !Empty(owner.CachedProperties) || !Empty(owner.CachedConstructors) ||
                !Empty(owner.CachedNestedTypes) || !Empty(owner.CachedSerializationProviders) ||
                PreparedCallProofs.CaptureLambdaContextContract(invocation, compilation, resolveType) is not { } contract) { return null; }
            var map = DeclaredArgumentMap.Create(contract, invocation.Arguments);
            if (!map.IsAvailable || !map.IsCurrent()) { return null; }
            var plan = new PreparedLambdaParameterPlan(method, header, docs, contract, map, environmentCurrent, csharp);
            if (!plan.Audit(invocation, null, new HashSet<object>(ReferenceEqualityComparer.Instance), 0)) { return null; }
            foreach (var argument in map.Parameters)
            {
                if (argument.EvaluationIndex is not int index || index < 0 || argument.Modifier != RefKind.None || argument.SuppliedExpression is not { } supplied) { continue; }
                var path = id.EdgePath + $"/argument[{index}]";
                if (!FindLambda(supplied, ref path, out var lambda) || lambda is null) { continue; }
                if (argument.Formal.SymbolType is not INamedTypeSymbol formal ||
                    PreparedCallProofs.ResolveMetadataDelegateInvoke(formal, compilation) is not { } invoke ||
                    invoke.ReturnsVoid || invoke.ReturnsByRef || invoke.ReturnsByRefReadonly || invoke.Parameters.Any(p => p.RefKind != RefKind.None) ||
                    !ContractCollections.TryCopy(lambda.Parameters, out var parameters) || parameters.Length == 0 || parameters.Length != invoke.Parameters.Length) { return null; }
                plan._frames.Add(new(plan, id with { EdgePath = path }, lambda, parameters.Select(p => p!).ToImmutableArray(), invoke));
            }
            return plan._frames.Count == 0 ? null : plan;
        }

        internal Frame? GetFrame(SourceOccurrenceId occurrence) => _frames.FirstOrDefault(f =>
            f.Occurrence.Generation == occurrence.Generation && f.Occurrence.File == occurrence.File &&
            f.Occurrence.MemberPath == occurrence.MemberPath && f.Occurrence.RootRole == occurrence.RootRole && f.Occurrence.RootIndex == occurrence.RootIndex &&
            (f.Occurrence.EdgePath == occurrence.EdgePath || occurrence.EdgePath.StartsWith(f.Occurrence.EdgePath + "/", StringComparison.Ordinal)));

        private bool Audit(object node, FuncExpression? lambda, HashSet<object> ancestors, int depth)
        {
            if (depth > 32 || !ancestors.Add(node)) { return false; }
            switch (node)
            {
                case FuncExpression closure:
                    if (lambda is not null || closure.BlockBody is not null || !ContractCollections.TryCopy(closure.Parameters, out var parameters) || parameters.IsEmpty ||
                        parameters.Any(p => p is null || !Identifier(p.RequestedName) || p.RequestedName == "global") ||
                        parameters.Distinct(ReferenceEqualityComparer.Instance).Count() != parameters.Length ||
                        parameters.Select(p => p!.RequestedName).Distinct(StringComparer.Ordinal).Count() != parameters.Length) { return false; }
                    foreach (var declaration in parameters)
                    {
                        if (_binders.TryGetValue(declaration!, out var previous) && !ReferenceEquals(previous, closure)) { return false; }
                        _binders[declaration!] = closure;
                    }
                    lambda = closure;
                    break;
                case VariableExpression variable when variable.GetType() == typeof(VariableExpression):
                    if (lambda is null || !ContractCollections.TryCopy(lambda.Parameters, out var declared) || !declared.Any(p => ReferenceEquals(p, variable.Declaration))) { return false; }
                    break;
                case TypeReferenceExpression reference:
                    if (reference.Type is not { } type || !Identifier(type.Name) || type.Namespace.Split('.').Any(p => !Identifier(p)) ||
                        !PreparedCallImportScope.HasPureFormattedTypes(new[] { type })) { return false; }
                    break;
                case InvokeMethodExpression call:
                    if (!Identifier(call.MethodSignature?.Name ?? call.MethodName) || call.InstanceReference is not TypeReferenceExpression ||
                        call.ExtensionType is not null || call.IsReducedExtensionIntent ||
                        call.TypeArguments is { } arguments && (!ContractCollections.TryCopy(arguments, out var types) || !PreparedCallImportScope.HasPureFormattedTypes(types))) { return false; }
                    break;
                case LiteralExpression literal:
                    if (literal.Literal is not (null or string or int or bool or char)) { return false; }
                    break;
                case KeywordExpression keyword when keyword.GetType() == typeof(KeywordExpression):
                    if (keyword.Expression is not null || keyword.Keyword is not ("null" or "default")) { return false; }
                    break;
                case ArgumentExpression argument:
                    if (argument.IsRef || argument.IsOut || argument.IsIn) { return false; }
                    break;
                case PositionalParameterReferenceExpression named:
                    if (!Identifier(named.ParameterName)) { return false; }
                    break;
                case ScopedApi wrapper when AttributeSnapshot.IsKnownWrapper(wrapper) && PreparedCallProofs.IsTransparentWrapper(wrapper):
                    break;
                default:
                    return false;
            }
            var shape = StructuredSourceShape.Capture(node, true);
            if (shape.Opaque) { return false; }
            _nodes.Add((node, shape));
            foreach (var child in shape.Children)
            { if (!Audit(child.Producer, lambda, ancestors, depth + 1)) { return false; } }
            ancestors.Remove(node);
            return true;
        }

        private static bool FindLambda(ValueExpression expression, ref string path, out FuncExpression? lambda)
        {
            var current = expression;
            for (var depth = 0; depth < 32; depth++)
            {
                switch (current)
                {
                    case FuncExpression found: lambda = found; return true;
                    case ScopedApi wrapper when AttributeSnapshot.IsKnownWrapper(wrapper) && PreparedCallProofs.IsTransparentWrapper(wrapper): current = wrapper.Original; break;
                    case ArgumentExpression argument when !argument.IsRef && !argument.IsOut && !argument.IsIn: current = argument.Expression; break;
                    case PositionalParameterReferenceExpression named: current = named.ParameterValue; break;
                    default: lambda = null; return false;
                }
                path += "/value";
            }
            lambda = null;
            return false;
        }

        private static bool Empty<T>(IReadOnlyList<T>? list) => ContractCollections.TryCopy(list, out var values) && values.IsEmpty;
        private static bool Identifier(string? name) => name is { Length: > 0 } && (name[0] == '_' || char.IsAsciiLetter(name[0])) &&
            name.All(c => c == '_' || char.IsAsciiLetterOrDigit(c)) && SyntaxFacts.GetKeywordKind(name) == SyntaxKind.None;

        internal sealed class Frame(PreparedLambdaParameterPlan plan, SourceOccurrenceId occurrence, FuncExpression lambda,
            ImmutableArray<CodeWriterDeclaration> parameters, IMethodSymbol invoke)
        {
            internal SourceOccurrenceId Occurrence => occurrence;
            internal ITypeSymbol? Resolve(VariableExpression variable)
            {
                if (variable.GetType() != typeof(VariableExpression) || !plan.IsCurrent) { return null; }
                for (var index = 0; index < parameters.Length; index++)
                { if (ReferenceEquals(parameters[index], variable.Declaration)) { return invoke.Parameters[index].Type; } }
                return null;
            }
            internal bool Matches(FuncExpression value, IMethodSymbol actualInvoke) => plan.IsCurrent && ReferenceEquals(lambda, value) && SymbolEqualityComparer.Default.Equals(invoke, actualInvoke);
        }
    }
}
