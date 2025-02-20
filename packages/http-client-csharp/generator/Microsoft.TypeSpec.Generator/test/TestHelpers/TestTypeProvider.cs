// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal class TestTypeProvider : TypeProvider
    {
        private readonly TypeSignatureModifiers? _declarationModifiers;
        protected override string BuildRelativeFilePath() => $"{Name}.cs";

        protected override string BuildName() => "TestName";

        protected override string BuildNamespace() => "Test";

        public static readonly TypeProvider Empty = new TestTypeProvider();

        internal TestTypeProvider(TypeSignatureModifiers? declarationModifiers = null)
        {
            _declarationModifiers = declarationModifiers;
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _declarationModifiers ?? base.BuildDeclarationModifiers();
    }
}
