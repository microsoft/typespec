// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class BinaryContentHelperDefinitionTests
    {
        [Test]
        public void FromObjectMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var binaryContentHelper = new BinaryContentHelperDefinition();
            Assert.IsNotNull(binaryContentHelper.Methods);
            var fromObjectMethod = binaryContentHelper.Methods.Single(m => m.Signature.Name == "FromObject"
                && m.Signature.Parameters[0].Type.Equals(typeof(object)));
            Assert.IsNotNull(fromObjectMethod);
            Assert.IsNotNull(fromObjectMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), fromObjectMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void FromObjectBinaryDataMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var binaryContentHelper = new BinaryContentHelperDefinition();
            Assert.IsNotNull(binaryContentHelper.Methods);
            var fromObjectMethod = binaryContentHelper.Methods.Single(m => m.Signature.Name == "FromObject"
                                                                           && m.Signature.Parameters[0].Type.Equals(typeof(BinaryData)));
            Assert.IsNotNull(fromObjectMethod);
            Assert.IsNotNull(fromObjectMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), fromObjectMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void FromEnumerableXmlMethodIsCorrectlyDefined()
        {
            var xmlModel = InputFactory.Model(
                "XmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                serializationOptions: InputFactory.Serialization.Options(
                    xml: InputFactory.Serialization.Xml("XmlModel")));
            MockHelpers.LoadMockGenerator(inputModels: () => [xmlModel]);

            var binaryContentHelper = new BinaryContentHelperDefinition();
            Assert.IsNotNull(binaryContentHelper.Methods);
            var method = binaryContentHelper.Methods.Single(m => m.Signature.Name == "FromEnumerable"
                && m.Signature.Parameters.Count == 3
                && m.Signature.Parameters[1].Name == "rootNameHint");
            Assert.IsNotNull(method);

            // Validate signature
            var signature = method.Signature;
            Assert.AreEqual("FromEnumerable", signature.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, signature.Modifiers);
            Assert.IsNotNull(signature.ReturnType);
            Assert.AreEqual(3, signature.Parameters.Count);
            Assert.AreEqual("enumerable", signature.Parameters[0].Name);
            Assert.AreEqual("rootNameHint", signature.Parameters[1].Name);
            Assert.AreEqual("childNameHint", signature.Parameters[2].Name);
            Assert.IsNotNull(signature.GenericArguments);
            Assert.AreEqual(1, signature.GenericArguments!.Count);
            Assert.IsNotNull(signature.GenericParameterConstraints);
            Assert.AreEqual(1, signature.GenericParameterConstraints!.Count);

            // Validate body
            Assert.IsNotNull(method.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), method.BodyStatements!.ToDisplayString());
        }
    }
}
