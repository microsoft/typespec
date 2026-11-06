// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed partial class PreparedFieldTypes
    {
        private static readonly Type TypeOfRuntimeTypeImplementation = typeof(object).GetType();

        /// <summary>
        /// Frozen namespace/operand ingredients, NOT an edit permission or a
        /// currentness certificate. No writer consumes this record. The enclosing
        /// type/method lookup, finite emitted-source policy, observations, imports
        /// and complete consumer-input lifetime have NOT been established here.
        /// </summary>
        internal sealed record PreparedTypeOfNamespaceLookupFacts(
            PreparedSourceFile File, PreparedSourceOccurrence Occurrence,
            CSharpType OwnerType, long OwnerTypeVersion,
            CSharpType OperandType, long OperandTypeVersion, Type RuntimeType,
            INamedTypeSymbol MetadataTarget, ImmutableHashSet<string> ForbiddenImports,
            string SimpleSpelling, string QualifiedSpelling);

        private static CSharpType? NamespaceSiteType(object producer) => producer switch
        {
            TypeOfExpression expression when producer.GetType() == typeof(TypeOfExpression) => expression.Type,
            DeclarationExpression declaration when producer.GetType() == typeof(DeclarationExpression) &&
                declaration.Variable is not null && declaration.Variable.GetType() == typeof(VariableExpression) => declaration.Variable.Type,
            _ => null
        };

        // Lookup ingredients only; the owning envelope must prove the exact site.
        // The inventories must be the same frozen inventories used by field/call
        // preparation, never a reconstructed owner or a synthetic FieldProvider.
        internal static PreparedTypeOfNamespaceLookupFacts? TryCaptureTypeOfNamespaceLookupFacts(
            PreparedSourceFile file, PreparedSourceOccurrence occurrence, CSharpCompilation compilation,
            IReadOnlyDictionary<(string Namespace, string Name), TypeProvider[]> generated,
            IReadOnlySet<string> namespacePrefixes)
        {
            if (NamespaceSiteType(occurrence.Producer) is not { } operand || occurrence.IsOpaque ||
                !file.IsCurrent() || !occurrence.IsCurrent() ||
                !file.Roots.SelectMany(root => root.DescendantsAndSelf()).Any(node => ReferenceEquals(node, occurrence)) ||
                file.FileOwner.CachedType is not { } ownerType || ownerType.GetType() != typeof(CSharpType) ||
                !IsSimpleIdentifier(ownerType.Name) || !ownerType.Namespace.Split('.').All(IsSimpleIdentifier) ||
                !generated.TryGetValue((ownerType.Namespace, ownerType.Name), out var owners) ||
                owners.Length != 1 || !ReferenceEquals(owners[0], file.FileOwner))
            {
                return null;
            }

            // Before IsArray/TryGetCSharpFriendlyName or ANY virtual Type
            // predicates: exact CSharpType dispatch and native RuntimeType only.
            if (operand.GetType() != typeof(CSharpType) || !operand.IsFrameworkType) { return null; }
            var runtime = operand.FrameworkType;
            if (runtime.GetType() != TypeOfRuntimeTypeImplementation ||
                (!ReferenceEquals(runtime, typeof(Exception)) && !ReferenceEquals(runtime, typeof(Uri))))
            {
                return null;
            }
            if (!HasSupportedFieldTypeShape(operand) || operand.HasUnionMetadata ||
                !ContractCollections.TryCopy(operand.Arguments, out var arguments) || !arguments.IsEmpty ||
                !runtime.IsClass || runtime.IsGenericType || runtime.ContainsGenericParameters || runtime.DeclaringType is not null ||
                operand.Name != runtime.Name || operand.Namespace != runtime.Namespace ||
                !IsSimpleIdentifier(operand.Name) || !operand.Namespace.Split('.').All(IsSimpleIdentifier) ||
                operand.TryGetCSharpFriendlyName(out _) ||
                generated.ContainsKey((operand.Namespace, operand.Name)) ||
                namespacePrefixes.Contains(operand.Namespace + "." + operand.Name))
            {
                return null;
            }

            // Reuse the existing field metadata resolver, including accessibility,
            // namespace-prefix competition, source veto and global-reference visibility.
            var target = ResolveReferencedTarget(compilation, operand, generated);
            if (target is not { TypeKind: TypeKind.Class, HasUnsupportedMetadata: false } ||
                runtime.FullName is not { } metadataName ||
                !SymbolEqualityComparer.Default.Equals(target, compilation.GetTypeByMetadataName(metadataName)) ||
                !string.Equals(target.ContainingAssembly.Identity.ToString(), runtime.Assembly.FullName, StringComparison.Ordinal))
            {
                // Deliberately strict native assembly identity. Reference-assembly
                // retargeting/forwarding needs another proof, not a name-only match.
                return null;
            }

            var lookup = new PreparedFieldImportLookup(compilation, generated, namespacePrefixes);
            if (!lookup.TryPrepareTypeOnlyNamespaceLookup(ownerType.Namespace, operand, target, out var competitors))
            {
                return null;
            }
            return new(file, occurrence, ownerType, ownerType.IdentityVersion, operand, operand.IdentityVersion, runtime,
                target, competitors, operand.Name, "global::" + operand.Namespace + "." + operand.Name);
        }
    }
}
