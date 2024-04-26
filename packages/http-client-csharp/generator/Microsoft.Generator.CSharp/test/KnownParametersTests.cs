// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
#pragma warning disable CS8618
    internal class KnownParametersTests
    {
        private Mock<TypeFactory> _factory;
        private KnownParameters _knownParameters;
#pragma warning restore CS8618

        [SetUp]
        public void Setup()
        {
            _factory = new Mock<TypeFactory>();
            _knownParameters = new KnownParameters(_factory.Object);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void TestTokenAuth(bool notImplemented)
        {
            if (notImplemented)
            {
                _factory.Setup(x => x.TokenCredentialType()).Throws<NotImplementedException>();
                Assert.That(() => _knownParameters.TokenAuth, Throws.Exception.TypeOf<NotImplementedException>());
            }
            else
            {
                _factory.Setup(x => x.TokenCredentialType()).Returns(new CSharpType(typeof(int)));
                var result = _knownParameters.TokenAuth;
                Assert.IsNotNull(result);
                Assert.IsNotNull(result.Type);
                Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void TestMatchConditionsParameter(bool notImplemented)
        {
            if (notImplemented)
            {
                _factory.Setup(x => x.MatchConditionsType()).Throws<NotImplementedException>();
                Assert.That(() => _knownParameters.MatchConditionsParameter, Throws.Exception.TypeOf<NotImplementedException>());
            }
            else
            {
                _factory.Setup(x => x.RequestConditionsType()).Returns(new CSharpType(typeof(int)));
                _factory.Setup(x => x.MatchConditionsType()).Returns(new CSharpType(typeof(int)));
                var result = _knownParameters.MatchConditionsParameter;
                Assert.IsNotNull(result);
                Assert.IsNotNull(result.Type);
                Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void TestRequestConditionsParameter(bool notImplemented)
        {
            if (notImplemented)
            {
                _factory.Setup(x => x.RequestConditionsType()).Throws<NotImplementedException>();
                Assert.That(() => _knownParameters.RequestConditionsParameter, Throws.Exception.TypeOf<NotImplementedException>());
            }
            else
            {
                _factory.Setup(x => x.RequestConditionsType()).Returns(new CSharpType(typeof(int)));
                _factory.Setup(x => x.MatchConditionsType()).Returns(new CSharpType(typeof(int)));
                var result = _knownParameters.RequestConditionsParameter;
                Assert.IsNotNull(result);
                Assert.IsNotNull(result.Type);
                Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
            }
        }
    }
}
