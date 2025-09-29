// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class MultiPartFormDataBinaryContentDefinitionTests
    {
        [Test]
        public void WriteToMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var multiPartFormData = new MultiPartFormDataBinaryContentDefinition();
            Assert.IsNotNull(multiPartFormData.Methods);
            var writeToMethod = multiPartFormData.Methods.Single(m => m.Signature.Name == "WriteTo");
            Assert.IsNotNull(writeToMethod);
            Assert.IsNotNull(writeToMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writeToMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void WriteToAsyncMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var multiPartFormData = new MultiPartFormDataBinaryContentDefinition();
            Assert.IsNotNull(multiPartFormData.Methods);
            var writeToMethod = multiPartFormData.Methods.Single(m => m.Signature.Name == "WriteToAsync");
            Assert.IsNotNull(writeToMethod);
            Assert.IsNotNull(writeToMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writeToMethod.BodyStatements!.ToDisplayString());
        }
    }
}
