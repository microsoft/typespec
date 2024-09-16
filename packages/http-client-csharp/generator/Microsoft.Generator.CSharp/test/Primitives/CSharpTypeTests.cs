// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Primitives
{
    internal class CSharpTypeTests
    {
        public CSharpTypeTests()
        {
            MockHelpers.LoadMockPlugin();
        }

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
        [TestCase(typeof(string))]
        [TestCase(typeof(int[]))]
        [TestCase(typeof(string[]))]
        [TestCase(typeof(IDictionary<int, string>))]
        [TestCase(typeof(int?))]
        public void NonFrameworkTypeEqualsEquivalentFrameworkType(Type type)
        {
            var cSharpType = new CSharpType(
                type.Name,
                type.Namespace!,
                type.IsValueType,
                Nullable.GetUnderlyingType(type) != null,
                null,
                type.GetGenericArguments().Select(t => new CSharpType(t)).ToList(),
                true,
                type.IsValueType);
            Assert.IsTrue(cSharpType.Equals(type));
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
        public void TypesAreNotEqualWhenNullabilityIsDifferent(Type type)
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
            var actual = new CSharpType(typeof(List<>), arguments: typeof(string)).GetGenericTypeDefinition();
            Assert.AreEqual(new CSharpType(typeof(List<>)), actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(ReadOnlyMemory<>), true)]
        public void IsReadOnlyMemory(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsReadOnlyMemory;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IEnumerable<>), true)]
        [TestCase(typeof(IReadOnlyList<>), true)]
        [TestCase(typeof(IReadOnlyCollection<>), false)]
        [TestCase(typeof(IList<>), false)]
        public void IsReadOnlyList(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsReadOnlyList;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IEnumerable<>), false)]
        [TestCase(typeof(IReadOnlyList<>), false)]
        [TestCase(typeof(IReadOnlyCollection<>), false)]
        [TestCase(typeof(IList<>), true)]
        [TestCase(typeof(List<>), true)]
        [TestCase(typeof(ICollection<>), true)]
        public void IsReadWriteList(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsReadWriteList;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IDictionary<,>), false)]
        [TestCase(typeof(ReadOnlyMemory<>), true)]
        [TestCase(typeof(IEnumerable<>), true)]
        [TestCase(typeof(IReadOnlyList<>), true)]
        [TestCase(typeof(IReadOnlyCollection<>), false)]
        [TestCase(typeof(IList<>), true)]
        [TestCase(typeof(List<>), true)]
        [TestCase(typeof(ICollection<>), true)]
        public void IsList(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsList;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(string[]), true)]
        [TestCase(typeof(int[]), true)]
        [TestCase(typeof(ReadOnlyMemory<>), false)]
        [TestCase(typeof(List<>), false)]
        public void IsArray(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsArray;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IDictionary<string, string>), false)]
        [TestCase(typeof(ReadOnlyMemory<>), false)]
        [TestCase(typeof(IReadOnlyDictionary<,>), true)]
        public void IsReadOnlyDictionary(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsReadOnlyDictionary;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IDictionary<string, string>), true)]
        [TestCase(typeof(ReadOnlyMemory<>), false)]
        [TestCase(typeof(IReadOnlyDictionary<,>), false)]
        public void IsReadWriteDictionary(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsReadWriteDictionary;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(IDictionary<,>), true)]
        [TestCase(typeof(ReadOnlyMemory<>), false)]
        [TestCase(typeof(IReadOnlyDictionary<,>), true)]
        [TestCase(typeof(List<>), false)]
        public void IsDictionary(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsDictionary;
            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(int), false)]
        [TestCase(typeof(string[]), false)]
        [TestCase(typeof(int[]), false)]
        [TestCase(typeof(IReadOnlyCollection<>), false)]
        [TestCase(typeof(IDictionary<string, string>), true)]
        [TestCase(typeof(IReadOnlyDictionary<,>), true)]
        [TestCase(typeof(ReadOnlyMemory<>), true)]
        [TestCase(typeof(IEnumerable<>), true)]
        [TestCase(typeof(IReadOnlyList<>), true)]
        [TestCase(typeof(IList<>), true)]
        [TestCase(typeof(List<>), true)]
        [TestCase(typeof(ICollection<>), true)]
        public void IsCollectionType(Type type, bool expected)
        {
            var actual = new CSharpType(type).IsCollection;
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void PropertyInitializationType_ReadOnlyMemory()
        {
            var arguments = typeof(int);
            var cSharpType = new CSharpType(typeof(ReadOnlyMemory<>), arguments: arguments);
            var actual = cSharpType.PropertyInitializationType;
            var expected = new CSharpType(typeof(ReadOnlyMemory<>), arguments: arguments);

            var areEqual = actual.Equals(expected);

            Assert.IsTrue(areEqual);
        }

        [TestCase(typeof(IList<>))]
        [TestCase(typeof(IReadOnlyList<>))]
        [TestCase(typeof(IEnumerable<>))]
        public void PropertyInitializationType_List(Type listType)
        {
            CSharpType[] arguments = [typeof(int)];
            var cSharpType = new CSharpType(listType, arguments: arguments);
            var actual = cSharpType.PropertyInitializationType;
            var expected = CodeModelPlugin.Instance.TypeFactory.ListInitializationType.MakeGenericType(arguments);

            Assert.AreEqual(expected, actual);
        }

        [TestCase(typeof(IDictionary<,>))]
        [TestCase(typeof(IReadOnlyDictionary<,>))]
        public void PropertyInitializationType_Dictionary(Type dictionaryType)
        {
            CSharpType[] arguments = [typeof(string), typeof(int)];
            var cSharpType = new CSharpType(dictionaryType, arguments: arguments);
            var actual = cSharpType.PropertyInitializationType;
            var expected = CodeModelPlugin.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(arguments);

            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void GetElementType_ReadOnlyMemory()
        {
            var arguments = typeof(int);
            var cSharpType = new CSharpType(typeof(ReadOnlyMemory<>), arguments: arguments);
            var actual = cSharpType.ElementType;
            var expected = cSharpType.Arguments[0];

            var areEqual = actual.Equals(expected);

            Assert.IsTrue(areEqual);
        }

        [Test]
        public void GetElementType_Dictionary()
        {
            var key = typeof(int);
            var value = typeof(string);
            var cSharpType = new CSharpType(typeof(IDictionary<,>), arguments: [key, value]);
            var actual = cSharpType.ElementType;
            var expected = cSharpType.Arguments[1];

            var areEqual = actual.Equals(expected);

            Assert.IsTrue(areEqual);
        }

        [TestCase(typeof(int), typeof(string), typeof(float))]
        public void ValidateUnion(params Type[] types)
        {
            var typesInUnion = types.Select(t => (CSharpType)t).ToArray();
            var type = CSharpType.FromUnion(typesInUnion, false);
            Assert.AreEqual(types.Length, type.UnionItemTypes.Count);
            for (int i = 0; i < typesInUnion.Length; i++)
            {
                Assert.AreEqual(typesInUnion[i], type.UnionItemTypes[i]);
            }
        }

        [TestCase(typeof(int), "int")]
        [TestCase(typeof(string), "string")]
        public void TestToString(Type type, string expectedString)
        {
            var cSharpType = new CSharpType(type);
            var actual = cSharpType.ToString();
            var expected = new StringBuilder()
                .Append(expectedString)
                .ToString();

            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void CacheFrameworkTypes()
        {
            CSharpType cSharpType1 = typeof(int);
            CSharpType cSharpType2 = typeof(int);
            Assert.IsTrue(ReferenceEquals(cSharpType1, cSharpType2));

            CSharpType cSharpType3 = typeof(IList<int>);
            CSharpType cSharpType4 = typeof(IList<int>);
            Assert.IsTrue(ReferenceEquals(cSharpType3, cSharpType4));

            CSharpType cSharpType5 = typeof(IDictionary<int, string>);
            CSharpType cSharpType6 = typeof(IDictionary<int, string>);
            Assert.IsTrue(ReferenceEquals(cSharpType5, cSharpType6));

            CSharpType cSharpType7 = typeof(IList<int>);
            CSharpType cSharpType8 = typeof(IList<string>);
            Assert.IsFalse(ReferenceEquals(cSharpType7, cSharpType8));
        }

        [TestCaseSource(nameof(ValidateNullableTypesData))]
        public void ValidateNullableTypes(Type type, IReadOnlyList<CSharpType> expectedArguments, bool expectedIsNullable)
        {
            var csharpType = new CSharpType(type);

            CollectionAssert.AreEqual(expectedArguments, csharpType.Arguments);
            Assert.AreEqual(expectedIsNullable, csharpType.IsNullable);
        }

        private static object[] ValidateNullableTypesData = [
            new object[]
            {
                typeof(int), Array.Empty<CSharpType>(), false
            },
            new object[]
            {
                typeof(int?), Array.Empty<CSharpType>(), true
            },
            new object[]
            {
                typeof(Uri), Array.Empty<CSharpType>(), false
            },
            new object[]
            {
                typeof(Guid), Array.Empty<CSharpType>(), false
            },
            new object[]
            {
                typeof(Guid?), Array.Empty<CSharpType>(), true
            },
            new object[]
            {
                typeof(TestStruct<int>), new CSharpType[] { typeof(int) }, false
            },
            new object[]
            {
                typeof(TestStruct<int>?), new CSharpType[] { typeof(int) }, true
            },
            new object[]
            {
                typeof(TestStruct<int?>), new CSharpType[] { typeof(int?) }, false
            },
            new object[]
            {
                typeof(TestStruct<int?>?), new CSharpType[] { typeof(int?) }, true
            },
            new object[]
            {
                typeof(TestStruct<TestStruct<int>>), new CSharpType[] { typeof(TestStruct<int>) }, false
            },
            new object[]
            {
                typeof(TestStruct<TestStruct<int>>?), new CSharpType[] { typeof(TestStruct<int>) }, true
            },
            new object[]
            {
                typeof(TestStruct<TestStruct<int>?>), new CSharpType[] { typeof(TestStruct<int>?) }, false
            },
            new object[]
            {
                typeof(TestStruct<TestStruct<int>?>?), new CSharpType[] { typeof(TestStruct<int>?) }, true
            },
        ];

        internal struct TestStruct<T> { }
    }
}
