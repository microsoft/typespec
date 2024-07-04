// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
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
            var expected = TypeReferenceExpression.FromType(t);

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
            var expected = TypeReferenceExpression.FromType(t2);

            Assert.AreNotEqual(expected, result);
        }

        [TestCaseSource(nameof(CSharpTypeOperatorEqualsTestCases))]
        public void CSharpTypeOperatorTestEqual(CSharpType t)
        {
            ValueExpression result = t;
            var expected = TypeReferenceExpression.FromType(t);

            Assert.AreEqual(expected, result);
        }

        [TestCaseSource(nameof(CSharpTypeOperatorNotEqualTestCases))]
        public void CSharpTypeOperatorTestNotEqual(CSharpType t1, CSharpType t2)
        {
            ValueExpression result = t1;
            var expected = TypeReferenceExpression.FromType(t2);

            Assert.AreNotEqual(expected, result);
        }

        [Test]
        public void MultipleAsSameObject()
        {
            //since the original expression is a scoped int casting back
            //should use the same object
            ValueExpression exp = Int(1);
            var scopedApi1 = exp.As<int>();
            var scopedApi2 = exp.As<int>();
            Assert.IsTrue(ReferenceEquals(scopedApi1, scopedApi2));
            Assert.IsTrue(ReferenceEquals(exp, scopedApi1));

            var scopedApi3 = exp.As(typeof(int));
            Assert.IsTrue(ReferenceEquals(exp, scopedApi3));

            var scopedApi4 = exp.As(new CSharpType(typeof(int)));
            Assert.IsTrue(ReferenceEquals(exp, scopedApi4));

            //since the original expression is not a scoped string casting back
            //should use a different object
            var scopedString1 = exp.As<string>();
            var scopedString2 = exp.As<string>();
            Assert.IsFalse(ReferenceEquals(scopedString1, scopedString2));
            Assert.IsFalse(ReferenceEquals(exp, scopedString1));

            var scopedString3 = exp.As(typeof(string));
            Assert.IsFalse(ReferenceEquals(scopedString1, scopedString3));

            //double cast should use the same object
            var scopedString4 = scopedString1.As<string>();
            Assert.IsTrue(ReferenceEquals(scopedString1, scopedString4));
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
