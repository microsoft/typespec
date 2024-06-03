// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class ValueExpressionTests
    {
        [TestCase(typeof(int))]
        [TestCase(typeof(long))]
        [TestCase(typeof(float))]
        [TestCase(typeof(double))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(string))]
        [TestCase(typeof(Guid))]
        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IList<int>))]
        [TestCase(typeof(IDictionary<,>))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>))]
        public void SystemTypeOperatorTestEqual(Type t)
        {
            ValueExpression result = t;
            var expected = new TypeReferenceExpression(t);

            Assert.AreEqual(expected, result);
        }

        [TestCase(typeof(int), typeof(string))]
        [TestCase(typeof(int), typeof(IList<>))]
        [TestCase(typeof(IList<>), typeof(int))]
        [TestCase(typeof(int), typeof(IList<int>))]
        [TestCase(typeof(IList<int>), typeof(int))]
        [TestCase(typeof(IList<int>), typeof(IList<>))]
        [TestCase(typeof(IList<>), typeof(IList<int>))]
        [TestCase(typeof(IList<int>), typeof(IList<string>))]
        [TestCase(typeof(IList<int>), typeof(ICollection<int>))]
        [TestCase(typeof(Tuple<>), typeof(Tuple<,>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(Dictionary<,>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(Dictionary<int, int>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(Dictionary<int, string>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>), typeof(IDictionary<IDictionary<string, int>, IDictionary<string, int>>))]
        public void SystemTypeOperatorTestNotEqual(Type t1, Type t2)
        {
            ValueExpression result = t1;
            var expected = new TypeReferenceExpression(t2);

            Assert.AreNotEqual(expected, result);
        }

        [TestCaseSource(nameof(CSharpTypeOperatorEqualsTestCases))]
        public void CSharpTypeOperatorTestEqual(CSharpType t)
        {
            ValueExpression result = t;
            var expected = new TypeReferenceExpression(t);

            Assert.AreEqual(expected, result);
        }

        [TestCaseSource(nameof(CSharpTypeOperatorNotEqualTestCases))]
        public void CSharpTypeOperatorTestNotEqual(CSharpType t1, CSharpType t2)
        {
            ValueExpression result = t1;
            var expected = new TypeReferenceExpression(t2);

            Assert.AreNotEqual(expected, result);
        }

        public static IEnumerable<TestCaseData> CSharpTypeOperatorEqualsTestCases
        {
            get
            {
                yield return new TestCaseData(new CSharpType(typeof(int)));
                yield return new TestCaseData(new CSharpType(typeof(string)));
                yield return new TestCaseData(new CSharpType(typeof(bool)));
                yield return new TestCaseData(new CSharpType(typeof(IList<>)));
            }
        }

        public static IEnumerable<TestCaseData> CSharpTypeOperatorNotEqualTestCases
        {
            get
            {
                yield return new TestCaseData(new CSharpType(typeof(int)), new CSharpType(typeof(bool)));
                yield return new TestCaseData(new CSharpType(typeof(string)), new CSharpType(typeof(int)));
                yield return new TestCaseData(new CSharpType(typeof(bool)), new CSharpType(typeof(string)));
                yield return new TestCaseData(new CSharpType(typeof(IList<>)), new CSharpType(typeof(IDictionary<,>)));
            }
        }
    }
}
