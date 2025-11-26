// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class MethodProviderHelpersTests
    {
        [Test]
        public void BuildXmlDocsAddsCorrectExceptions()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Public,
                null,
                $"return description",
                [
                    new ParameterProvider("param1", $"description for param1", typeof(string), validation: ParameterValidationType.AssertNotNullOrEmpty),
                    new ParameterProvider("param2", $"description for param2", typeof(int?), validation: ParameterValidationType.AssertNotNull)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var xmlDocs = MethodProviderHelpers.BuildXmlDocs(method, enclosingType);

            Assert.AreEqual(2, xmlDocs.Exceptions.Count);
            Assert.AreEqual(
                "/// <exception cref=\"global::System.ArgumentNullException\"> <paramref name=\"param1\"/> or <paramref name=\"param2\"/> is null. </exception>\n",
                xmlDocs.Exceptions[0].ToDisplayString());
            Assert.AreEqual(
                "/// <exception cref=\"global::System.ArgumentException\"> <paramref name=\"param1\"/> is an empty string, and was expected to be non-empty. </exception>\n",
                xmlDocs.Exceptions[1].ToDisplayString());
        }

        [Test]
        public void GetParamHash_PublicMethodOnPublicType_ReturnsValidationHash()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Public,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull),
                    new ParameterProvider("param2", $"description", typeof(int))
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamHash(method, enclosingType);

            Assert.IsNotNull(paramHash);
            Assert.AreEqual(1, paramHash!.Count);
            Assert.IsTrue(paramHash.ContainsKey(ParameterValidationType.AssertNotNull));
            Assert.AreEqual(1, paramHash[ParameterValidationType.AssertNotNull].Count);
            Assert.AreEqual("param1", paramHash[ParameterValidationType.AssertNotNull][0].Name);
        }

        [Test]
        public void GetParamHash_InternalMethodOnPublicType_ReturnsNull()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Internal,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamHash(method, enclosingType);

            Assert.IsNull(paramHash);
        }

        [Test]
        public void GetParamHash_PublicMethodOnInternalType_ReturnsNull()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Public,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Internal);
            var paramHash = MethodProviderHelpers.GetParamHash(method, enclosingType);

            Assert.IsNull(paramHash);
        }

        [Test]
        public void GetParamHash_ProtectedMethodOnPublicType_ReturnsValidationHash()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Protected,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNullOrEmpty)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamHash(method, enclosingType);

            Assert.IsNotNull(paramHash);
            Assert.AreEqual(1, paramHash!.Count);
            Assert.IsTrue(paramHash.ContainsKey(ParameterValidationType.AssertNotNullOrEmpty));
        }

        [Test]
        public void GetParamHash_PrivateMethodOnPublicType_ReturnsNull()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Private,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamHash(method, enclosingType);

            Assert.IsNull(paramHash);
        }

        [Test]
        public void GetBodyStatementWithValidation_AddsValidationStatements()
        {
            MockHelpers.LoadMockGenerator();
            var param1 = new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull);
            var param2 = new ParameterProvider("param2", $"description", typeof(string), validation: ParameterValidationType.AssertNotNullOrEmpty);

            var parameters = new[] { param1, param2 };
            var paramHash = new Dictionary<ParameterValidationType, List<ParameterProvider>>
            {
                [ParameterValidationType.AssertNotNull] = new List<ParameterProvider> { param1 },
                [ParameterValidationType.AssertNotNullOrEmpty] = new List<ParameterProvider> { param2 }
            };

            var bodyStatement = Throw(Null);
            var result = MethodProviderHelpers.GetBodyStatementWithValidation(parameters, bodyStatement, paramHash);

            Assert.IsNotNull(result);
            // Should have 2 validation statements + 1 empty line + 1 body statement = 4 statements
            var statements = result as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.AreEqual(4, statements!.Statements.Count);
        }

        [Test]
        public void GetBodyStatementWithValidation_NoValidation_ReturnsOriginalBody()
        {
            var parameters = new[] { new ParameterProvider("param1", $"description", typeof(string)) };
            var bodyStatement = MethodBodyStatement.Empty;
            var result = MethodProviderHelpers.GetBodyStatementWithValidation(parameters, bodyStatement, null);

            Assert.AreSame(bodyStatement, result);
        }

        [Test]
        public void GetBodyStatementWithValidation_EmptyParamHash_ReturnsOriginalBody()
        {
            var parameters = new[] { new ParameterProvider("param1", $"description", typeof(string)) };
            var paramHash = new Dictionary<ParameterValidationType, List<ParameterProvider>>();
            var bodyStatement = MethodBodyStatement.Empty;
            var result = MethodProviderHelpers.GetBodyStatementWithValidation(parameters, bodyStatement, paramHash);

            Assert.AreSame(bodyStatement, result);
        }

        [Test]
        public void BuildXmlDocs_InternalMethod_NoExceptions()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Internal,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNull)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Public);
            var xmlDocs = MethodProviderHelpers.BuildXmlDocs(method, enclosingType);

            Assert.AreEqual(0, xmlDocs.Exceptions.Count);
        }

        [Test]
        public void BuildXmlDocs_PublicMethodOnInternalType_NoExceptions()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Public,
                null,
                null,
                [
                    new ParameterProvider("param1", $"description", typeof(string), validation: ParameterValidationType.AssertNotNullOrEmpty)
                ]);

            var enclosingType = new TestTypeProvider("TestType", declarationModifiers: TypeSignatureModifiers.Internal);
            var xmlDocs = MethodProviderHelpers.BuildXmlDocs(method, enclosingType);

            Assert.AreEqual(0, xmlDocs.Exceptions.Count);
        }
    }
}
