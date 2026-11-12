// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    public class ArgumentExpressionTests
    {
        [Test]
        public void ArgumentExpressionWithoutModifiers()
        {
            var variable = new VariableExpression(typeof(int), "foo");
            var argument = new ArgumentExpression(variable);
            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("foo", writer.ToString(false));
        }

        [Test]
        public void ArgumentExpressionWithRef()
        {
            var variable = new VariableExpression(typeof(int), "foo");
            var argument = new ArgumentExpression(variable, IsRef: true);
            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("ref foo", writer.ToString(false));
        }

        [Test]
        public void ArgumentExpressionWithOut()
        {
            var variable = new VariableExpression(typeof(int), "foo");
            var argument = new ArgumentExpression(variable, IsOut: true);
            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("out foo", writer.ToString(false));
        }

        [Test]
        public void ArgumentExpressionUpdateChangesModifiers()
        {
            var variable = new VariableExpression(typeof(int), "foo");
            var argument = new ArgumentExpression(variable);

            argument.Update(isRef: true);

            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("ref foo", writer.ToString(false));
        }

        [Test]
        public void ArgumentExpressionUpdateChangesExpression()
        {
            var variable1 = new VariableExpression(typeof(int), "foo");
            var variable2 = new VariableExpression(typeof(int), "bar");
            var argument = new ArgumentExpression(variable1, IsRef: true);

            argument.Update(expression: variable2);

            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("ref bar", writer.ToString(false));
        }

        [Test]
        public void ParameterProviderAsArgumentWithRef()
        {
            MockHelpers.LoadMockGenerator();
            var parameter = new ParameterProvider("myParam", $"", typeof(int), isRef: true);
            var argument = Snippet.AsArgument(parameter);

            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("ref myParam", writer.ToString(false));
        }

        [Test]
        public void ParameterProviderAsArgumentWithOut()
        {
            MockHelpers.LoadMockGenerator();
            var parameter = new ParameterProvider("myParam", $"", typeof(int), isOut: true);
            var argument = Snippet.AsArgument(parameter);

            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("out myParam", writer.ToString(false));
        }

        [Test]
        public void ParameterProviderAsArgumentWithoutModifiers()
        {
            MockHelpers.LoadMockGenerator();
            var parameter = new ParameterProvider("myParam", $"", typeof(int));
            var argument = Snippet.AsArgument(parameter);

            using CodeWriter writer = new CodeWriter();
            argument.Write(writer);

            Assert.AreEqual("myParam", writer.ToString(false));
        }

        [Test]
        public void ParameterProviderAsVariableDoesNotIncludeModifiers()
        {
            MockHelpers.LoadMockGenerator();
            var parameter = new ParameterProvider("myParam", $"", typeof(int), isRef: true);
            VariableExpression variable = parameter;

            using CodeWriter writer = new CodeWriter();
            variable.Write(writer);

            Assert.AreEqual("myParam", writer.ToString(false));
        }
    }
}
