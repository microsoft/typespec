// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ParameterProviderTests
    {
        [Test]
        public void Equals_SameInstance_ReturnsTrue()
        {
            // Arrange
            var parameter = new ParameterProvider("name", $"Description", new CSharpType(typeof(string)));

            // Act
            var result = parameter.Equals(parameter);

            // Assert
            Assert.True(result);
        }

        [TestCaseSource(nameof(NotEqualsTestCases))]
        public void Equals(ParameterProvider p1, ParameterProvider? p2, bool areEqual)
        {
            var result = p1.Equals(p2);
            Assert.AreEqual(areEqual, result);
        }

        [Test]
        public void NotSameInstance()
        {
            MockHelpers.LoadMockPlugin();

            var param = new InputParameter("name", "name", "description", new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "string"), RequestLocation.Body, null, InputOperationParameterKind.Spread, false, false, false, false, false, false, false, null, null);
            var paramProvider1 = CodeModelPlugin.Instance.TypeFactory.CreateParameter(param);
            var paramProvider2 = CodeModelPlugin.Instance.TypeFactory.CreateParameter(param);
            Assert.IsFalse(ReferenceEquals(paramProvider1, paramProvider2));
        }

        private static IEnumerable<TestCaseData> NotEqualsTestCases()
        {
            yield return new TestCaseData(
                new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
                null,
                false);
            yield return new TestCaseData(
                new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
                new ParameterProvider("name", $"Description", new CSharpType(typeof(int))),
                false);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               true);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               new ParameterProvider("name1", $"Description", new CSharpType(typeof(string))),
               false);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(int)), [])]),
               new ParameterProvider("name1", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(string)), [])]),
               false);
        }
    }
}
