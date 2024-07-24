// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Providers;
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
            var outputLibrary = new TestOutputLibraryOverridingVisitors(new [] { new TestOutputLibraryVisitor() });
            Assert.AreEqual(1, outputLibrary.GetOutputLibraryVisitors().Count());

            outputLibrary.AddVisitor(new TestOutputLibraryVisitor());
            Assert.AreEqual(2, outputLibrary.GetOutputLibraryVisitors().Count());
        }

        private class TestOutputLibraryVisitor : OutputLibraryVisitor
        {
        }

        private class TestOutputLibrary : OutputLibrary
        {
            protected override TypeProvider[] BuildTypeProviders()
            {
                throw new NotImplementedException();
            }
        }

        private class TestOutputLibraryOverridingVisitors : OutputLibrary
        {
            private readonly IEnumerable<OutputLibraryVisitor>? _visitors;
            public TestOutputLibraryOverridingVisitors(IEnumerable<OutputLibraryVisitor>? visitors = null)
            {
                _visitors = visitors;
            }

            protected internal override IEnumerable<OutputLibraryVisitor> GetOutputLibraryVisitors()
            {
                foreach (var visitor in base.GetOutputLibraryVisitors())
                {
                    yield return visitor;
                }
                foreach (var visitor in _visitors ?? [])
                {
                    yield return visitor;
                }
            }

            protected override TypeProvider[] BuildTypeProviders()
            {
                throw new NotImplementedException();
            }
        }
    }
}
