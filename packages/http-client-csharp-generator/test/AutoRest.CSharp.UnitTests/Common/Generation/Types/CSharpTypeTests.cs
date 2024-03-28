// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Types.Tests
{
    public class CSharpTypeTests
    {
        [TestCase(typeof(int))]
        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IList<int>))]
        [TestCase(typeof(IDictionary<,>))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>))]
        public void TypesAreEqual(Type type)
        {
            var cst1 = new CSharpType(type);
            var cst2 = new CSharpType(type);
            Assert.IsTrue(cst1.Equals(cst2));
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IList<int>))]
        [TestCase(typeof(IDictionary<,>))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>))]
        public void EqualToFrameworkType(Type type)
        {
            var cst = new CSharpType(type);
            Assert.IsTrue(cst.Equals(type));
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IList<int>))]
        [TestCase(typeof(IDictionary<,>))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>))]
        public void HashCodesAreEqual(Type type)
        {
            var cst1 = new CSharpType(type);
            var cst2 = new CSharpType(type);
            Assert.AreEqual(cst1.GetHashCode(), cst2.GetHashCode());
        }

        [TestCase(typeof(IList<>), new[] { typeof(int) })]
        [TestCase(typeof(IReadOnlyList<>), new[] { typeof(string) })]
        [TestCase(typeof(IDictionary<,>), new[] { typeof(string), typeof(string) })]
        [TestCase(typeof(IReadOnlyDictionary<,>), new[] { typeof(string), typeof(int) })]
        [TestCase(typeof(IDictionary<,>), new[] { typeof(string), typeof(IDictionary<string, int>) })]
        public void TypesAreEqualForGenericTypes(Type type, Type[] arguments)
        {
            var cstArguments = arguments.Select(t => (CSharpType)t);
            // pass the arguments in as an array
            var cst1 = new CSharpType(type, cstArguments.ToArray());
            // pass the arguments in as an `List<CSharpType>`
            var cst2 = new CSharpType(type, cstArguments.ToList());
            // pass the arguments in as an `ImmutableArray`
            var cst3 = new CSharpType(type, cstArguments.ToImmutableArray());
            // pass the arguments in as an `ImmutableList`
            var cst4 = new CSharpType(type, cstArguments.ToImmutableList());

            Assert.IsTrue(cst1.Equals(cst2));
            Assert.IsTrue(cst2.Equals(cst3));
            Assert.IsTrue(cst3.Equals(cst4));

            Assert.AreEqual(cst1.GetHashCode(), cst2.GetHashCode());
            Assert.AreEqual(cst2.GetHashCode(), cst3.GetHashCode());
            Assert.AreEqual(cst3.GetHashCode(), cst4.GetHashCode());
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
        public void TypesAreNotEqual(Type type1, Type type2)
        {
            var cst1 = new CSharpType(type1);
            var cst2 = new CSharpType(type2);
            Assert.IsFalse(cst1.Equals(cst2));
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(int))]
        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IList<int>))]
        [TestCase(typeof(IList<int?>))]
        [TestCase(typeof(IList<string>))]
        [TestCase(typeof(IDictionary<int, string>))]
        [TestCase(typeof(IDictionary<string, string>))]
        [TestCase(typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<string, int?>))]
        [TestCase(typeof(IDictionary<int?, string>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>))]
        public void TypesAreNotEqualWhenNullibilityIsDifferent(Type type)
        {
            var cst = new CSharpType(type);
            var nullableCst = new CSharpType(type, isNullable: true);

            Assert.IsFalse(cst.Equals(nullableCst));
            Assert.AreNotEqual(cst.GetHashCode(), nullableCst.GetHashCode());
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
        [TestCase(typeof(IDictionary<int, string>), typeof(Dictionary<int, string>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>), typeof(IDictionary<IDictionary<string, int>, IDictionary<string, int>>))]
        public void NotEqualToFrameworkType(Type type1, Type type2)
        {
            var cst = new CSharpType(type1);
            Assert.IsFalse(cst.Equals(type2));
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
        [TestCase(typeof(IDictionary<int, string>), typeof(Dictionary<int, string>))]
        [TestCase(typeof(IDictionary<int, string>), typeof(IDictionary<string, int>))]
        [TestCase(typeof(IDictionary<IDictionary<int, string>, IDictionary<string, int>>), typeof(IDictionary<IDictionary<string, int>, IDictionary<string, int>>))]
        public void HashCodesAreNotEqual(Type type1, Type type2)
        {
            var cst1 = new CSharpType(type1);
            var cst2 = new CSharpType(type2);
            Assert.AreNotEqual(cst1.GetHashCode(), cst2.GetHashCode());
        }

        [TestCase(typeof(IDictionary<int, string>), typeof(IDictionary<,>), false)]
        [TestCase(typeof(IDictionary<int, IList<string>>), typeof(IDictionary<,>), false)]
        [TestCase(typeof(KeyValuePair<int, string>), typeof(KeyValuePair<,>), false)]
        [TestCase(typeof(KeyValuePair<int, string>), typeof(KeyValuePair<,>), true)]
        public void GetGenericTypeDefinition(Type input, Type expected, bool isNullable)
        {
            var actual = new CSharpType(input, isNullable).GetGenericTypeDefinition();
            Assert.AreEqual(new CSharpType(expected, isNullable), actual);
            CollectionAssert.AreEqual(actual.Arguments, input.GetGenericTypeDefinition().GetGenericArguments().Select(p => new CSharpType(p)));
        }

        [TestCase]
        public void GetGenericTypeDefinitionForConstructedType()
        {
            var actual = new CSharpType(typeof(List<>), typeof(string)).GetGenericTypeDefinition();
            Assert.AreEqual(new CSharpType(typeof(List<>)), actual);
        }
    }
}
