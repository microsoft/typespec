// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// A snapshot of an actual provider declaration on the standard writer path.
    /// This is not a selected call, complete lookup group, or declaration-envelope proof.
    /// </summary>
    internal sealed class PreparedGeneratedMethodDeclaration
    {
        internal MethodProvider Method { get; }
        internal TypeProvider Owner { get; }
        internal DeclaredCallableContract Contract { get; }
        internal PreparedGeneratedDocumentationEnvelope? DocumentationEnvelope { get; }
        private readonly PreparedSourceFile.OwnerSnapshot _ownerSnapshot;
        private readonly StructuredSourceShape _shape;
        private readonly long _revision;
        private int _stale;

        private PreparedGeneratedMethodDeclaration(MethodProvider method, DeclaredCallableContract contract)
        {
            Method = method;
            Owner = method.EnclosingType;
            Contract = contract;
            DocumentationEnvelope = PreparedGeneratedDocumentationEnvelope.TryCapture(method.XmlDocs);
            _ownerSnapshot = new(Owner);
            _shape = StructuredSourceShape.Capture(method, true);
            _revision = method.DeclarationRevision;
        }

        internal static PreparedGeneratedMethodDeclaration? TryCapture(MethodProvider method, Compilation compilation)
        {
            if (!CodeWriter.HasMethodDeclaration(method)) { return null; }
            // FromProvider validates exact membership in the captured owner. It
            // remains declaration metadata: selection additionally needs the full
            // written lookup surface, applicability and emission-envelope proof.
            var contract = DeclaredCallableContract.FromProvider(method, compilation);
            return contract.IsAvailable && contract.IsCurrent() ? new(method, contract) : null;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (Method.DeclarationRevision == _revision && ReferenceEquals(Method.EnclosingType, Owner) && CodeWriter.HasMethodDeclaration(Method) &&
                    _ownerSnapshot.IsCurrent() && Contract.IsCurrent() && (DocumentationEnvelope is null || DocumentationEnvelope.IsCurrent) &&
                    _shape.Matches(StructuredSourceShape.Capture(Method, true))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }
    }
}
