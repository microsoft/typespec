// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class ScmMethodProviderCollectionTests
    {
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p2", InputPrimitiveType.String, isRequired: true),
            ]);

        // Validate that the default method collection consists of the expected method kind(s)
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestDefaultCSharpMethodCollection(InputOperation inputOperation)
        {
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);

            MockHelpers.LoadMockPlugin(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var methodCollection = new ScmMethodProviderCollection(inputOperation, ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient));
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var method = methodCollection![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual(inputOperation.Name.ToCleanName(), signature.Name);

            var parameters = signature.Parameters;
            Assert.IsNotNull(parameters);
            Assert.AreEqual(inputOperation.Parameters.Count + 1, parameters.Count);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{inputOperation.Name.ToCleanName()}");
            Assert.IsNotNull(convenienceMethod);

            var convenienceMethodParams = convenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(convenienceMethodParams);

            var spreadInputParameter = inputOperation.Parameters.FirstOrDefault(p => p.Kind == InputOperationParameterKind.Spread);
            if (spreadInputParameter != null)
            {
                var spreadModelProperties = _spreadModel.Properties;
                // model properties + 2 (parameter and cancellation token)
                Assert.AreEqual(spreadModelProperties.Count + 2, convenienceMethodParams.Count);
                Assert.AreEqual("p1", convenienceMethodParams[0].Name);
                Assert.AreEqual(spreadModelProperties[0].Name, convenienceMethodParams[1].Name);
            }
        }

        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void ConvenienceMethodsHaveOptionalCancellationToken(InputOperation inputOperation)
        {
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);

            MockHelpers.LoadMockPlugin(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var methodCollection = new ScmMethodProviderCollection(inputOperation, ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient));
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var asyncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{inputOperation.Name.ToCleanName()}Async");
            Assert.IsNotNull(asyncConvenienceMethod);

            var asyncConvenienceMethodParameters = asyncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(asyncConvenienceMethodParameters);

            var lastParameter = asyncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);

            var syncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                   && m.Signature.Name == inputOperation.Name.ToCleanName());
            Assert.IsNotNull(syncConvenienceMethod);

            var syncConvenienceMethodParameters = syncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(syncConvenienceMethodParameters);

            lastParameter = syncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);
        }

        public static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.Parameter(
                            "message",
                            InputPrimitiveType.Boolean,
                            isRequired: true)
                    ]));

                // Operation with spread parameter
                yield return new TestCaseData(InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.Parameter(
                            "spread",
                            _spreadModel,
                            location: RequestLocation.Body,
                            isRequired: true,
                            kind: InputOperationParameterKind.Spread),
                        InputFactory.Parameter(
                            "p1",
                            InputPrimitiveType.Boolean,
                            location: RequestLocation.Path,
                            isRequired: true,
                            kind: InputOperationParameterKind.Method)
                    ]));
            }
        }
    }
}
