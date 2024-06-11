// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SourceInput;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class TypeProviderWriterTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private TypeProviderWriter _expressionTypeProviderWriter;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            var mockTypeProvider = new Mock<TypeProvider>() { CallBase = true };
            _expressionTypeProviderWriter = new MockExpressionTypeProviderWriter(mockTypeProvider.Object);
        }

        // Tests that the Write method is successfully overridden.
        [Test]
        public void Write_Override()
        {
            Assert.That(_expressionTypeProviderWriter.Write, Throws.Exception.TypeOf<NotImplementedException>());
        }

        internal class MockExpressionTypeProviderWriter : TypeProviderWriter
        {
            public MockExpressionTypeProviderWriter(TypeProvider provider) : base(provider) { }

            public override CodeFile Write()
            {
                throw new NotImplementedException();
            }
        }
    }
}
