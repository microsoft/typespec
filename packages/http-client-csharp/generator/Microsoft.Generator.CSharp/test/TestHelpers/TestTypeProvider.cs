// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class TestTypeProvider : TypeProvider
    {
        private readonly TypeSignatureModifiers? _declarationModifiers;
        protected override string BuildRelativeFilePath() => $"{Name}.cs";

        protected override string BuildName() => "TestName";

        public static readonly TypeProvider Empty = new TestTypeProvider();

        internal TestTypeProvider(TypeSignatureModifiers? declarationModifiers = null)
        {
            _declarationModifiers = declarationModifiers;
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers ?? base.GetDeclarationModifiers();
    }
}
