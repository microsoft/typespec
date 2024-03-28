// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Azure;
using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Types.Tests
{
    public class TypeFactoryTests
    {
        [TestCase(typeof(int), false)]
        [TestCase(typeof(AsyncPageable<>), true)]
        [TestCase(typeof(AsyncPageable<int>), true)]
        [TestCase(typeof(TestAsyncPageable<>), false)]
        [TestCase(typeof(TestAsyncPageable<int>), false)]
        [TestCase(typeof(Pageable<>), false)]
        [TestCase(typeof(Pageable<int>), false)]
        [TestCase(typeof(TestPageable<>), false)]
        [TestCase(typeof(TestPageable<int>), false)]
        public void IsAsyncPageable(Type type, bool expected)
            => Assert.AreEqual(TypeFactory.IsAsyncPageable(new CSharpType(type)), expected);

        [TestCase(typeof(int), false)]
        [TestCase(typeof(AsyncPageable<>), false)]
        [TestCase(typeof(AsyncPageable<int>), false)]
        [TestCase(typeof(TestAsyncPageable<>), false)]
        [TestCase(typeof(TestAsyncPageable<int>), false)]
        [TestCase(typeof(Pageable<>), true)]
        [TestCase(typeof(Pageable<int>), true)]
        [TestCase(typeof(TestPageable<>), false)]
        [TestCase(typeof(TestPageable<int>), false)]
        public void IsPageable(Type type, bool expected)
            => Assert.AreEqual(TypeFactory.IsPageable(new CSharpType(type)), expected);

        private class TestPageable<T> : Pageable<T> where T : notnull
        {
            private readonly IEnumerable<Page<T>> _enumerable;
            public TestPageable(IEnumerable<Page<T>> enumerable) => _enumerable = enumerable;
            public override IEnumerable<Page<T>> AsPages(string? continuationToken = null, int? pageSizeHint = null) => _enumerable;
        }

        private class TestAsyncPageable<T> : AsyncPageable<T> where T : notnull
        {
            private readonly IAsyncEnumerable<Page<T>> _enumerable;
            public TestAsyncPageable(IAsyncEnumerable<Page<T>> enumerable) => _enumerable = enumerable;
            public override IAsyncEnumerable<Page<T>> AsPages(string? continuationToken = null, int? pageSizeHint = null) => _enumerable;
        }
    }
}
