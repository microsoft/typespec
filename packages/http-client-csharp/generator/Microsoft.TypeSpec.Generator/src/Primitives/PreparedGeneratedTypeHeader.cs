// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// A bounded standard-writer type header over already finalized caches.
    /// It does not establish a complete generated member group or source universe.
    /// </summary>
    internal sealed class PreparedGeneratedTypeHeader
    {
        internal TypeProvider Owner { get; }
        internal IEnumerable<string> ImportNamespaces => _documentation.ImportNamespaces;
        internal IEnumerable<CSharpType> ImportTypes => _documentation.ImportTypes;
        private readonly PreparedSourceFile.OwnerSnapshot _ownerSnapshot;
        private readonly XmlDocProvider _docs;
        private readonly PreparedGeneratedDocumentationEnvelope _documentation;
        private int _stale;

        private PreparedGeneratedTypeHeader(TypeProvider owner, XmlDocProvider docs, PreparedGeneratedDocumentationEnvelope documentation)
        {
            Owner = owner;
            _ownerSnapshot = new(owner);
            _docs = docs;
            _documentation = documentation;
        }

        internal static PreparedGeneratedTypeHeader? TryCapture(TypeProvider owner)
        {
            if (!HasKnownHeader(owner) || owner.CachedXmlDocs is not { } docs ||
                PreparedGeneratedDocumentationEnvelope.TryCapture(docs) is not { } documentation) { return null; }
            return new(owner, docs, documentation);
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_ownerSnapshot.IsCurrent() && HasKnownHeader(Owner) && ReferenceEquals(Owner.CachedXmlDocs, _docs) &&
                    _documentation.IsCurrent) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        private static bool HasKnownHeader(TypeProvider owner)
        {
            if (owner.CachedType is not { } type || type.GetType() != typeof(CSharpType) || type.IsFrameworkType ||
                type.DeclaringType is not null || type.BaseType is not null || !Identifier(type.Name) ||
                type.Namespace.Length == 0 || !type.Namespace.Split('.').All(part => Identifier(part) && SyntaxFacts.GetKeywordKind(part) == SyntaxKind.None) ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                owner.CachedDeclarationModifiers is not { } modifiers || !modifiers.HasFlag(TypeSignatureModifiers.Class)) { return false; }
            const TypeSignatureModifiers allowed = TypeSignatureModifiers.Class | TypeSignatureModifiers.Public | TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial;
            if ((modifiers & ~allowed) != 0 || (modifiers & (TypeSignatureModifiers.Public | TypeSignatureModifiers.Internal)) ==
                (TypeSignatureModifiers.Public | TypeSignatureModifiers.Internal)) { return false; }
            // An observed path is not a cached value of the intentionally uncached
            // RelativeFilePath getter. This first family requires explicit pinning.
            if (owner.PinnedRelativeFilePath is not { Length: > 0 } path || path.IndexOfAny(['\r', '\n', '\u0085', '\u2028', '\u2029']) >= 0 ||
                !owner.IsCustomCodeViewMaterialized || owner.CachedCustomCodeView is not null || owner.SerializationProviderOwner is not null ||
                owner.CachedWhereClause is not null || !ContractCollections.TryCopy(owner.CachedImplements, out var interfaces) || !interfaces.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedWriteAttributes, out var attributes) || !attributes.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedDisabledFileWarnings, out var warnings) || !warnings.IsEmpty) { return false; }
            // These null-returning getters are not memoized when they return null.
            // Inspect dispatch metadata rather than calling an override to guess
            // what its next invocation during writing might do.
            return DefaultMethod(owner, "BuildWhereClause") && DefaultMethod(owner, "BuildDeclaringTypeProvider") &&
                DefaultMethod(owner, "get_ShouldWriteTypeXmlDocs") && DefaultMethod(owner, "get_ShouldAnalyzeAttributesInReferenceMap");
        }

        private static bool DefaultMethod(TypeProvider owner, string name) =>
            owner.GetType().GetMethod(name, BindingFlags.NonPublic | BindingFlags.Instance, null, Type.EmptyTypes, null)?.DeclaringType == typeof(TypeProvider);

        private static bool Identifier(string value) => value.Length > 0 && (value[0] == '_' || char.IsAsciiLetter(value[0])) &&
            value.All(c => c == '_' || char.IsAsciiLetterOrDigit(c));
    }
}
