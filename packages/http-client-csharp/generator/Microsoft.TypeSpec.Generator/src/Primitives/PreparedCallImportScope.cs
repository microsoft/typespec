// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// A bounded file-import upper bound, not a binder or an editing permission.
    /// Every possible scope contributes competitors; witness visibility is proved
    /// separately. Unknown written inputs withhold this new reduced-call family.
    /// </summary>
    internal sealed class PreparedCallImportScope
    {
        private static readonly Type RuntimeTypeImplementation = typeof(object).GetType();
        private readonly CSharpCompilation _compilation;
        private readonly ImmutableArray<PreparedGeneratedMethodGroup> _envelopes;
        private readonly ImmutableArray<(object Node, StructuredSourceShape Shape)> _bodies;
        private readonly ImmutableArray<INamespaceSymbol> _scopes;
        private readonly ImmutableHashSet<string> _namespaceNames;
        private readonly ImmutableHashSet<string> _globalImports;
        private int _stale;

        private PreparedCallImportScope(CSharpCompilation compilation, ImmutableArray<PreparedGeneratedMethodGroup> envelopes,
            ImmutableArray<(object Node, StructuredSourceShape Shape)> bodies, ImmutableArray<INamespaceSymbol> scopes,
            ImmutableHashSet<string> names, ImmutableHashSet<string> globals)
        {
            _compilation = compilation; _envelopes = envelopes; _bodies = bodies; _scopes = scopes;
            _namespaceNames = names; _globalImports = globals;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_envelopes.All(e => e.IsCurrent) && _bodies.All(b => b.Shape.Matches(StructuredSourceShape.Capture(b.Node, true)))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        internal static PreparedCallImportScope? TryCapture(IReadOnlyList<TypeProvider> owners, CSharpCompilation compilation)
        {
            if (compilation.ScriptCompilationInfo is not null || compilation.SyntaxTrees.Any(t => t.Options.Kind != SourceCodeKind.Regular) ||
                compilation.References.Any(r => r.Properties.Aliases.Any(a => a != "global")) ||
                compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error)) { return null; }
            var names = ImmutableHashSet.CreateBuilder<string>(StringComparer.Ordinal);
            var globals = ImmutableHashSet.CreateBuilder<string>(StringComparer.Ordinal);
            var envelopes = ImmutableArray.CreateBuilder<PreparedGeneratedMethodGroup>();
            var bodies = ImmutableArray.CreateBuilder<(object, StructuredSourceShape)>();
            names.Add(string.Empty);
            foreach (var import in compilation.Options.Usings)
            {
                if (!Namespace(import)) { return null; }
                // Options.Usings do not import namespaces into ordinary generated
                // C# files. They may contribute conservative competitors, never
                // witness visibility. Script inputs are not this finite family.
                names.Add(import);
            }
            foreach (var tree in compilation.SyntaxTrees)
            {
                // Already loaded original source, never generated-body parsing.
                if (tree.GetRoot() is not CompilationUnitSyntax root) { return null; }
                foreach (var import in root.Usings.Where(u => u.GlobalKeyword.RawKind != 0))
                {
                    if (import.Alias is not null || import.StaticKeyword.RawKind != 0 || import.Name is null) { return null; }
                    var name = import.Name.ToString();
                    if (name.StartsWith("global::", StringComparison.Ordinal)) { name = name[8..]; }
                    if (!Namespace(name)) { return null; }
                    globals.Add(name); names.Add(name);
                }
            }
            foreach (var owner in owners)
            {
                // This profile closes headers, signatures, suppressions, XML,
                // inventory and factory dispatch. Its candidates are NOT used
                // to select generated calls; ordinary admission stays separate.
                if (PreparedGeneratedMethodGroup.TryCaptureImportEnvelope(owner, compilation) is not { } envelope) { return null; }
                envelopes.Add(envelope);
                foreach (var name in Ancestors(owner.CachedType!.Namespace)) { names.Add(name); }
                foreach (var type in envelope.ImportTypes)
                {
                    if (!CaptureTypeImports(type, names, 0)) { return null; }
                }
                foreach (var name in envelope.ImportNamespaces)
                {
                    if (!Namespace(name)) { return null; }
                    names.Add(name);
                }
                foreach (var candidate in envelope.Candidates)
                {
                    var body = (object?)candidate.Declaration.Method.BodyStatements ?? candidate.Declaration.Method.BodyExpression;
                    if (body is null || !CaptureBody(body, names, bodies, new HashSet<object>(ReferenceEqualityComparer.Instance), 0)) { return null; }
                }
            }
            var scopes = ImmutableArray.CreateBuilder<INamespaceSymbol>();
            foreach (var name in names)
            {
                INamespaceSymbol? scope = compilation.GlobalNamespace;
                if (name.Length != 0)
                {
                    foreach (var part in name.Split('.'))
                    {
                        if (scope is null) { break; }
                        var members = scope.GetMembers(part);
                        if (members.Any(m => m is not INamespaceSymbol)) { return null; }
                        scope = members.OfType<INamespaceSymbol>().SingleOrDefault();
                    }
                }
                // A namespace introduced only by audited written declarations
                // has no loaded candidates. Those declarations cannot be extensions.
                if (scope is not null) { scopes.Add(scope); }
            }
            return new(compilation, envelopes.ToImmutable(), bodies.ToImmutable(), scopes.ToImmutable(), names.ToImmutable(), globals.ToImmutable());
        }

        internal PreparedReducedExtensionGroup? Lookup(ITypeSymbol receiver, string name, CSharpType? hint, string fileNamespace)
        {
            if (!IsCurrent || !Identifier(name) || receiver is not INamedTypeSymbol target || target.IsStatic || target.Arity != 0 ||
                target.ContainingType is not null || target.TypeKind is not (TypeKind.Class or TypeKind.Struct)) { return null; }
            var hierarchy = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            for (var current = target; current is not null; current = current.BaseType)
            {
                // Stronger than proving every instance overload inapplicable.
                if (!hierarchy.Add(current) || current.TypeKind == TypeKind.Error || current.HasUnsupportedMetadata || current.GetMembers(name).Length != 0) { return null; }
            }
            var visible = _globalImports.Union(Ancestors(fileNamespace));
            if (hint is not null)
            {
                // The exact current invocation always registers this namespace;
                // it does not identify a target or exclude competing containers.
                if (!_namespaceNames.Contains(hint.Namespace)) { return null; }
                visible = visible.Add(hint.Namespace);
            }
            var methods = ImmutableArray.CreateBuilder<IMethodSymbol>();
            foreach (var scope in _scopes)
            {
                foreach (var type in scope.GetTypeMembers())
                {
                    foreach (var method in type.GetMembers(name).OfType<IMethodSymbol>().Where(m => m.IsExtensionMethod))
                    {
                        if (type.ContainingType is not null || type.Arity != 0 || !type.IsStatic || type.TypeKind != TypeKind.Class ||
                            type.DeclaredAccessibility != Accessibility.Public || type.HasUnsupportedMetadata ||
                            method.MethodKind != MethodKind.Ordinary || !method.IsStatic || method.DeclaredAccessibility != Accessibility.Public ||
                            method.IsVararg || method.ReturnsByRef || method.ReturnsByRefReadonly || method.HasUnsupportedMetadata ||
                            method.Parameters.Length == 0 || method.Parameters.Any(p => p.IsParams || p.RefKind != RefKind.None) ||
                            !SymbolEqualityComparer.Default.Equals(method.ContainingAssembly, _compilation.Assembly) && !method.Locations.Any(l => l.IsInMetadata)) { return null; }
                        var constructed = ConstructReceiverOnly(method, receiver);
                        if (constructed is null) { return null; }
                        methods.Add(constructed);
                    }
                }
            }
            return new(methods.ToImmutable(), visible, () => IsCurrent);
        }

        private static IMethodSymbol? ConstructReceiverOnly(IMethodSymbol method, ITypeSymbol receiver)
        {
            if (method.Arity == 0) { return method; }
            if (method.Arity != 1 || receiver is not INamedTypeSymbol { IsRefLikeType: false } ||
                receiver.SpecialType is SpecialType.System_Void or SpecialType.System_TypedReference or SpecialType.System_ArgIterator or SpecialType.System_RuntimeArgumentHandle)
            { return null; }
            var parameter = method.TypeParameters[0];
            // Exactly one inference input: the actual entire receiver type.
            // Other formal occurrences (including contravariant nested ones)
            // could change inference even when convertible under this choice.
            if (!SymbolEqualityComparer.Default.Equals(method.Parameters[0].Type, parameter) ||
                parameter.HasConstructorConstraint || parameter.HasReferenceTypeConstraint || parameter.HasValueTypeConstraint ||
                parameter.HasNotNullConstraint || parameter.HasUnmanagedTypeConstraint || !parameter.ConstraintTypes.IsEmpty ||
                method.Parameters.Skip(1).Any(p => ContainsParameter(p.Type, parameter, 0))) { return null; }
            return method.Construct(receiver);
        }

        private static bool ContainsParameter(ITypeSymbol type, ITypeParameterSymbol parameter, int depth)
        {
            if (depth > 32 || SymbolEqualityComparer.Default.Equals(type, parameter)) { return true; }
            return type switch
            {
                IArrayTypeSymbol array => ContainsParameter(array.ElementType, parameter, depth + 1),
                IPointerTypeSymbol pointer => ContainsParameter(pointer.PointedAtType, parameter, depth + 1),
                INamedTypeSymbol named => named.TypeArguments.Any(t => ContainsParameter(t, parameter, depth + 1)) ||
                    named.ContainingType is { } owner && ContainsParameter(owner, parameter, depth + 1),
                IFunctionPointerTypeSymbol pointer => ContainsParameter(pointer.Signature.ReturnType, parameter, depth + 1) ||
                    pointer.Signature.Parameters.Any(p => ContainsParameter(p.Type, parameter, depth + 1)),
                _ => false
            };
        }

        private static bool CaptureBody(object node, ImmutableHashSet<string>.Builder names,
            ImmutableArray<(object Node, StructuredSourceShape Shape)>.Builder snapshots, HashSet<object> ancestors, int depth)
        {
            if (depth > 64 || !ancestors.Add(node)) { return false; }
            var shape = StructuredSourceShape.Capture(node, true);
            if (shape.Opaque) { return false; }
            snapshots.Add((node, shape));
            // The import-envelope grammar has already validated names, payloads
            // and owned lists. Do not collect Variable.Type / wrapper type hints.
            if (node is TypeReferenceExpression { Type: { } reference } && !CaptureTypeImports(reference, names, 0)) { return false; }
            if (node is InvokeMethodExpression invocation)
            {
                if (invocation.ExtensionType is { } extension) { names.Add(extension.Namespace); }
                if (invocation.TypeArguments is { } list)
                {
                    if (!ContractCollections.TryCopy(list, out var types)) { return false; }
                    foreach (var type in types) { if (!CaptureTypeImports(type, names, 0)) { return false; } }
                }
            }
            foreach (var child in shape.Children)
            {
                if (!CaptureBody(child.Producer, names, snapshots, ancestors, depth + 1)) { return false; }
            }
            ancestors.Remove(node);
            return true;
        }

        internal static bool HasPureFormattedTypes(IEnumerable<CSharpType> types)
        {
            var names = ImmutableHashSet.CreateBuilder<string>(StringComparer.Ordinal);
            return types.All(t => CaptureTypeImports(t, names, 0));
        }

        private static bool CaptureTypeImports(CSharpType type, ImmutableHashSet<string>.Builder names, int depth)
        {
            if (depth > 32 || type.GetType() != typeof(CSharpType) || !Namespace(type.Namespace) ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments)) { return false; }
            names.Add(type.Namespace);
            if (type.IsFrameworkType && !CaptureRuntimeTypeImports(type.FrameworkType, names, depth + 1)) { return false; }
            if (type.DeclaringType is { } declaring && !CaptureTypeImports(declaring, names, depth + 1)) { return false; }
            return arguments.All(a => a is not null && CaptureTypeImports(a, names, depth + 1));
        }

        private static bool CaptureRuntimeTypeImports(Type type, ImmutableHashSet<string>.Builder names, int depth)
        {
            // Friendly-name formatting dispatches through virtual Type members.
            // A TypeDelegator can retain a harmless cached CSharpType name yet
            // inject imports during writing. Audit dispatch before predicates.
            if (depth > 32 || type.GetType() != RuntimeTypeImplementation) { return false; }
            if (type.IsGenericParameter) { return true; }
            var name = type.Namespace ?? string.Empty;
            if (!Namespace(name)) { return false; }
            names.Add(name);
            if (type.HasElementType && (type.GetElementType() is not { } element || !CaptureRuntimeTypeImports(element, names, depth + 1))) { return false; }
            if (type.DeclaringType is { } declaring && !CaptureRuntimeTypeImports(declaring, names, depth + 1)) { return false; }
            return !type.IsGenericType || type.GetGenericArguments().All(a => CaptureRuntimeTypeImports(a, names, depth + 1));
        }

        private static IEnumerable<string> Ancestors(string name)
        {
            yield return name;
            while (name.Length != 0)
            {
                var index = name.LastIndexOf('.');
                name = index < 0 ? string.Empty : name[..index];
                yield return name;
            }
        }

        private static bool Namespace(string name) => name.Length == 0 || name.Split('.').All(Identifier);
        private static bool Identifier(string name) => name.Length > 0 && (name[0] == '_' || char.IsAsciiLetter(name[0])) &&
            name.All(c => c == '_' || char.IsAsciiLetterOrDigit(c)) && SyntaxFacts.GetKeywordKind(name) == SyntaxKind.None;
    }
}
