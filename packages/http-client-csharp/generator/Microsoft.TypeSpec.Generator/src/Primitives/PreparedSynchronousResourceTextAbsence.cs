// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// A bounded synchronous reference-resource disposal cannot capture the
    /// resource expression's text. This proves neither a selected factory nor
    /// layout, general conversion safety, or editing permission.
    /// </summary>
    internal sealed class PreparedSynchronousResourceTextAbsence
    {
        private readonly Func<bool> _current;
        private int _stale;
        private PreparedSynchronousResourceTextAbsence(Func<bool> current) { _current = current; }
        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_current()) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        internal static PreparedSynchronousResourceTextAbsence? TryCapture(PreparedSourceOccurrence occurrence, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?>? resolveType, Func<bool>? environmentCurrent)
        {
            if (compilation is not CSharpCompilation csharp) { return null; }
            CSharpType? writtenType;
            string role;
            switch (occurrence.Producer)
            {
                case UsingScopeStatement scope: writtenType = scope.Type; role = "/resource"; break;
                case AssignmentExpression { UseNullCoalesce: false, Variable: DeclarationExpression { IsUsing: true, IsOut: false, IsConst: false } declaration }
                    when declaration.Variable.GetType() == typeof(VariableExpression) && csharp.LanguageVersion >= LanguageVersion.CSharp8:
                    writtenType = declaration.Variable.Type; role = "/value"; break;
                default: return null;
            }
            // Actual qualified emitted declaration, not a value's advertised type.
            if (resolveType is null || environmentCurrent is null || writtenType is not { } type || type.GetType() != typeof(CSharpType) ||
                !type.IsFrameworkType || type.FrameworkType.GetType() != typeof(object).GetType() || type.IsNullable || type.DeclaringType is not null ||
                type.FrameworkType.IsNested || type.FrameworkType.IsGenericType || type.FrameworkType.IsArray ||
                type.Name != type.FrameworkType.Name || type.Namespace != type.FrameworkType.Namespace ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                !DeclaredTypeSnapshot.TryCapture(type, out var snapshot) || snapshot is null ||
                resolveType(type) is not { TypeKind: TypeKind.Class, IsStatic: false, IsSealed: true, Arity: 0 } declared ||
                declared.HasUnsupportedMetadata || !declared.Locations.Any(l => l.IsInMetadata)) { return null; }
            var disposable = compilation.GetSpecialType(SpecialType.System_IDisposable);
            if (disposable.TypeKind != TypeKind.Interface || disposable.HasUnsupportedMetadata ||
                !declared.AllInterfaces.Any(i => SymbolEqualityComparer.Default.Equals(i, disposable))) { return null; }
            var resource = occurrence.Children.SingleOrDefault(c => c.Id.EdgePath == occurrence.Id.EdgePath + role);
            if (resource?.Producer is not InvokeMethodExpression { InstanceReference: TypeReferenceExpression, IsReducedExtensionIntent: false, ExtensionType: null }) { return null; }
            ImmutableArray<IMethodSymbol> candidates;
            Func<bool> callCurrent;
            if (resource.CallProofs?.Selection is { Contract.DeclarationSymbol: IMethodSymbol selected } selection)
            { candidates = [selected]; callCurrent = () => selection.IsCurrent; }
            else if (resource.CallProofs?.ObservationAbsence is { } absence && !absence.Candidates.IsEmpty)
            { candidates = absence.Candidates; callCurrent = () => absence.IsCurrent; }
            else { return null; }
            // Uniform actual native returns are enough for identity initialization,
            // independently of which overload wins. Do not manufacture selection.
            if (candidates.Any(m => m.MethodKind != MethodKind.Ordinary || !m.IsStatic || m.Arity != 0 || m.HasUnsupportedMetadata ||
                m.ReturnsByRef || m.ReturnsByRefReadonly || !m.Locations.Any(l => l.IsInMetadata) ||
                !SymbolEqualityComparer.Default.Equals(m.ReturnType, declared))) { return null; }
            return new(() => environmentCurrent() && occurrence.IsCurrent() && snapshot.IsCurrent() && callCurrent());
        }
    }
}
