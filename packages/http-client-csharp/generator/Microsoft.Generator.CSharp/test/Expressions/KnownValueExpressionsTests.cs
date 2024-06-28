// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    public class KnownValueExpressionsTests
    {
        [Test]
        public void BinaryOperatorExpressionWithOrOperator()
        {
            var left = ValueExpression.Empty;
            var right = ValueExpression.Empty;
            var boolExpression = new BoolSnippet(left);

            var result = boolExpression.Or(right);
            using var writer = new CodeWriter();
            result.Expression.Write(writer);

            Assert.AreEqual("(||)", writer.ToString(false));
        }

        [Test]
        public void BinaryOperatorExpressionWithAndOperator()
        {
            var left = ValueExpression.Empty;
            var right = ValueExpression.Empty;
            var boolExpression = new BoolSnippet(left);

            var result = boolExpression.And(right);
            using var writer = new CodeWriter();
            result.Expression.Write(writer);

            Assert.AreEqual("(&&)", writer.ToString(false));
        }

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
        public void ListExpression(Type T)
        {
            var itemType = new CSharpType(T);
            var untypedValue = ValueExpression.Empty;

            var listExpression = new ListSnippet(itemType, untypedValue);

            using var writer = new CodeWriter();
            listExpression.Expression.Write(writer);

            Assert.AreEqual(itemType, listExpression.ItemType);
            Assert.AreEqual("", writer.ToString(false));
        }

        [Test]
        public void ListExpressionAddItem()
        {
            var item = ValueExpression.Empty;
            var listExpression = new ListSnippet(new CSharpType(typeof(int)), ValueExpression.Empty);

            var result = listExpression.Add(item);

            var expectedStatement = listExpression.Invoke("Add", item).Terminate();

            Assert.AreEqual(expectedStatement.ToString(), result.ToString());
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
        public void DictionaryExpression(Type t1, Type t2)
        {
            var keyType = new CSharpType(t1);
            var valueType = new CSharpType(t2);
            var untypedValue = ValueExpression.Empty;

            var dictionaryExpression = new DictionarySnippet(t1, t2, untypedValue);

            Assert.AreEqual(keyType, dictionaryExpression.KeyType);
            Assert.AreEqual(valueType, dictionaryExpression.ValueType);
        }


        [Test]
        public void DictionaryExpressionAddItems()
        {
            var keyType = new CSharpType(typeof(int));
            var valueType = new CSharpType(typeof(string));
            var dictionaryExpression = new DictionarySnippet(keyType, valueType, ValueExpression.Empty);

            var key = ValueExpression.Empty;
            var value = ValueExpression.Empty;
            var result = dictionaryExpression.Add(key, value);

            var expectedStatement = dictionaryExpression.Invoke(nameof(Dictionary<object, object>.Add), key, value).Terminate();

            Assert.AreEqual(expectedStatement.ToString(), result.ToString());
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
        public void KeyValuePairExpression(Type t1, Type t2)
        {
            var keyType = new CSharpType(t1);
            var valueType = new CSharpType(t2);
            var untypedValue = ValueExpression.Empty;

            var keyValuePairExpression = new KeyValuePairSnippet(keyType, valueType, untypedValue);
            var expectedKey = new MemberExpression(keyValuePairExpression, nameof(KeyValuePair<string, string>.Key));
            var expectedValue = new MemberExpression(keyValuePairExpression, nameof(KeyValuePair<string, string>.Value));

            Assert.AreEqual(expectedKey, keyValuePairExpression.Key);
            Assert.AreEqual(expectedValue, keyValuePairExpression.Value);
            Assert.AreEqual(keyType, keyValuePairExpression.KeyType);
            Assert.AreEqual(valueType, keyValuePairExpression.ValueType);
        }

        [Test]
        public void EnumerableExpressionWithAnyMethodCall()
        {
            var itemType = new CSharpType(typeof(int));
            var untypedValue = ValueExpression.Empty;
            var enumerableExpression = new EnumerableSnippet(itemType, untypedValue);

            var result = enumerableExpression.Any();
            using CodeWriter writer = new CodeWriter();
            result.Expression.Write(writer);

            Assert.AreEqual(".Any()", writer.ToString(false));
        }
    }
}
