// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal class TestTypeProvider : TypeProvider
    {
        private readonly TypeSignatureModifiers? _declarationModifiers;
        private readonly MethodProvider[] _methods;
        protected override string BuildRelativeFilePath() => $"{Name}.cs";

        protected override string BuildName() => "TestName";

        protected override string BuildNamespace() => "Test";

        protected override MethodProvider[] BuildMethods() => _methods;

        public static readonly TypeProvider Empty = new TestTypeProvider();

        internal TestTypeProvider(TypeSignatureModifiers? declarationModifiers = null, IEnumerable<MethodProvider>? methods = null)
        {
            _declarationModifiers = declarationModifiers;
            _methods = methods?.ToArray() ?? [];
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _declarationModifiers ?? base.BuildDeclarationModifiers();
    }
}
