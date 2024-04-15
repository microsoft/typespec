// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class ApiTypesTests
    {
#pragma warning disable CS8618
#pragma warning disable CS8602
        private Mock<ApiTypes> _mock;

        [SetUp]
        public void Setup()
        {
            _mock = new Mock<ApiTypes>();
        }
        [Test]
        public void TestChangeTrackingListType()
        {
            Assert.IsNotNull(_mock?.Object);

            _mock.Setup(x => x.ChangeTrackingListType).Returns(typeof(int));
            Assert.AreEqual(typeof(int), _mock.Object.ChangeTrackingListType);
        }

        [Test]
        public void TestChangeTrackingDictionaryType()
        {
            _mock.Setup(x => x.ChangeTrackingDictionaryType).Returns(typeof(int));
            Assert.AreEqual(typeof(int), _mock.Object.ChangeTrackingDictionaryType);
        }


        [Test]
        public void TestEndPointSampleValue()
        {
            Assert.IsNotNull(_mock?.Object);
            _mock.Setup(x => x.EndPointSampleValue).Returns("Sample");
            Assert.AreEqual("Sample", _mock.Object.EndPointSampleValue);
        }

        [Test]
        public void TestResponseType()
        {
            Assert.IsNotNull(_mock?.Object);
            _mock.Setup(x => x.ResponseType).Returns(typeof(int));
            Assert.AreEqual(typeof(int), _mock.Object.ResponseType);
        }

        [Test]
        public void TestResponseOfTType()
        {
            Assert.IsNotNull(_mock?.Object);
            _mock.Setup(x => x.ResponseOfTType).Returns(typeof(int));
            Assert.AreEqual(typeof(int), _mock.Object.ResponseOfTType);
        }

        [Test]
        public void TestFromResponseName()
        {
            Assert.IsNotNull(_mock?.Object);
            Assert.AreEqual("FromResponse", _mock.Object.FromResponseName);
        }

        [Test]
        public void TestResponseParameterName()
        {
            Assert.IsNotNull(_mock?.Object);
            _mock.Setup(x => x.ResponseParameterName).Returns("Response");
            Assert.AreEqual("Response", _mock.Object.ResponseParameterName);
        }
    }
}
