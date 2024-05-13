// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Writers;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class ExpressionTypeProviderWriterTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private ExpressionTypeProviderWriter _expressionTypeProviderWriter;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            SourceInputModel? sourceInputModel = null;
            var mockTypeProvider = new Mock<TypeProvider>(sourceInputModel!) { CallBase = true };
            _expressionTypeProviderWriter = new MockExpressionTypeProviderWriter(new CodeWriter(), mockTypeProvider.Object);
        }

        // Tests that the Write method is successfully overridden.
        [Test]
        public void Write_Override()
        {
            Assert.That(_expressionTypeProviderWriter.Write, Throws.Exception.TypeOf<NotImplementedException>());
        }

        internal class MockExpressionTypeProviderWriter : ExpressionTypeProviderWriter
        {
            public MockExpressionTypeProviderWriter(CodeWriter writer, TypeProvider provider) : base(writer, provider) { }

            public override void Write()
            {
                throw new NotImplementedException();
            }
        }
    }
}
