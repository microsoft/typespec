// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class MethodProviderTests
    {
        [Test]
        public void CorrectUsingIsAppliedForOperatorMethod()
        {
            MockHelpers.LoadMockGenerator();
            var enclosingType = new TestTypeProvider();
            var writer = new TypeProviderWriter(enclosingType);
            var file = writer.Write();
            StringAssert.Contains("using System.IO;", file.Content);
        }

        private class TestTypeProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => $"{Name}.cs";

            protected override string BuildName() => "TestName";

            protected override string BuildNamespace() => "Test";

            public static readonly TypeProvider Empty = new TestTypeProvider();

            protected override MethodProvider[] BuildMethods()
            {
                return [new MethodProvider(
                    new MethodSignature(
                        Name,
                        $"",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                        MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                        new CSharpType(typeof(Stream)),
                        $"",
                        [new ParameterProvider("input", $"", Type, null)]),
                    Throw(Null),
                    this)];
            }

            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public;
        }

    }
}
