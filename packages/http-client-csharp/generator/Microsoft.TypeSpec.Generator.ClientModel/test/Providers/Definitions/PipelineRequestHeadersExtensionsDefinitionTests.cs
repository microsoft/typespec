// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class PipelineRequestHeadersExtensionsDefinitionTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ValidateAddMethodIsGenerated()
        {
            var definition = new PipelineRequestHeadersExtensionsDefinition();

            Assert.IsNotNull(definition.Methods);
            var addMethod = definition.Methods.SingleOrDefault(m =>
                m.Signature.Name == "Add" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(new global::Microsoft.TypeSpec.Generator.Primitives.CSharpType(typeof(IDictionary<,>), typeof(string), typeof(string)))));
            Assert.IsNotNull(addMethod, "Add method with prefix and dictionary parameters should be generated");
            Assert.IsNotNull(addMethod!.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), addMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void ValidateSetDelimitedMethodsAreGenerated()
        {
            var definition = new PipelineRequestHeadersExtensionsDefinition();

            Assert.IsNotNull(definition.Methods);
            var setDelimitedMethods = definition.Methods.Where(m => m.Signature.Name == "SetDelimited").ToList();
            Assert.AreEqual(2, setDelimitedMethods.Count, "Two SetDelimited overloads should be generated");
        }

        [Test]
        public void ValidateDefinitionIsInternalAndStatic()
        {
            var definition = new PipelineRequestHeadersExtensionsDefinition();

            Assert.IsTrue(definition.DeclarationModifiers.HasFlag(global::Microsoft.TypeSpec.Generator.Primitives.TypeSignatureModifiers.Internal));
            Assert.IsTrue(definition.DeclarationModifiers.HasFlag(global::Microsoft.TypeSpec.Generator.Primitives.TypeSignatureModifiers.Static));
        }

        [Test]
        public void ValidateAddMethodExtensionParameterType()
        {
            var definition = new PipelineRequestHeadersExtensionsDefinition();

            var addMethod = definition.Methods.SingleOrDefault(m =>
                m.Signature.Name == "Add" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(new global::Microsoft.TypeSpec.Generator.Primitives.CSharpType(typeof(IDictionary<,>), typeof(string), typeof(string)))));
            Assert.IsNotNull(addMethod);
            // First parameter should be PipelineRequestHeaders (the extension target)
            Assert.IsTrue(addMethod!.Signature.Parameters[0].Type.Equals(typeof(PipelineRequestHeaders)));
            // Second parameter should be string (prefix)
            Assert.IsTrue(addMethod.Signature.Parameters[1].Type.Equals(typeof(string)));
            Assert.AreEqual("prefix", addMethod.Signature.Parameters[1].Name);
            // Third parameter should be IDictionary<string, string>
            Assert.IsTrue(addMethod.Signature.Parameters[2].Type.IsDictionary);
        }
    }
}
