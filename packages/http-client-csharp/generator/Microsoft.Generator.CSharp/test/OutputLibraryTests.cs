// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class OutputLibraryTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private OutputLibrary _outputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _outputLibrary = new TestOutputLibrary();
        }

        // Tests that the BuildTypeProviders method is successfully overridden.
        [Test]
        public void BuildTypeProviders_Override()
        {
            var mockOutputLibrary = new Mock<OutputLibrary>();
            mockOutputLibrary.Protected().Setup<TypeProvider[]>("BuildTypeProviders").Throws<NotImplementedException>();
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.TypeProviders; });
        }

        [Test]
        public void CanAddVisitors()
        {
            _outputLibrary.AddVisitor(new TestOutputLibraryVisitor());
            Assert.AreEqual(1, _outputLibrary.GetOutputLibraryVisitors().Count());
        }

        [Test]
        public void CanOverrideGetOutputLibraryVisitors()
        {
            var outputLibrary = new TestOutputLibrary(new [] { new TestOutputLibraryVisitor() });
            Assert.AreEqual(1, outputLibrary.GetOutputLibraryVisitors().Count());

            outputLibrary.AddVisitor(new TestOutputLibraryVisitor());
            Assert.AreEqual(2, outputLibrary.GetOutputLibraryVisitors().Count());
        }
    }
}
