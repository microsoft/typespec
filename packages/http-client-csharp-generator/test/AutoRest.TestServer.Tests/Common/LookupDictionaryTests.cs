// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using AutoRest.CSharp.Common.Utilities;
using NUnit.Framework;

namespace AutoRest.CSharp.Utilities.Tests
{
    public class LookupDictionaryTests
    {
        [TestCase]
        public void CanAddItems()
        {
            var dict = new LookupDictionary<Item, string, int>(item => item.Name);
            dict.Add(new Item("1"), 1);
            dict.Add(new Item("2"), 2);
            dict.Add(new Item("3"), 3);

            Assert.AreEqual(3, dict.Count);
        }

        [TestCase]
        public void CanRemoveItems()
        {
            var dict = new LookupDictionary<Item, string, int>(item => item.Name);
            dict.Add(new Item("1"), 1);
            dict.Add(new Item("2"), 2);
            dict.Add(new Item("3"), 3);

            Assert.AreEqual(3, dict.Count);
            dict.Remove(new Item("3"));
            Assert.AreEqual(2, dict.Count);
        }

        [TestCase]
        public void CanImplicitCast()
        {
            var dict = new LookupDictionary<Item, string, int>(item => item.Name)
            {
                [new Item("1")] = 1,
                [new Item("2")] = 2,
                [new Item("3")] = 3
            };

            Dictionary<Item, int> values = dict;
            Dictionary<Item, int> expected = new Dictionary<Item, int>()
            {
                [new Item("1")] = 1,
                [new Item("2")] = 2,
                [new Item("3")] = 3
            };
            CollectionAssert.AreEquivalent(expected, values);

            Dictionary<string, int> valuesAlternative = dict;
            Dictionary<string, int> expectedAlternative = new Dictionary<string, int>()
            {
                ["1"] = 1,
                ["2"] = 2,
                ["3"] = 3
            };
            CollectionAssert.AreEquivalent(expectedAlternative, valuesAlternative);
        }

        internal record struct Item(string Name);
    }
}
