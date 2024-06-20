using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace TestProjects.Local.Tests
{
    public class ExtensibleEnumTests
    {
        [TestCase("a", "A", true)]
        [TestCase("A", "A", true)]
        [TestCase("A", "B", false)]
        public void EqualsIgnoreCasing(string v1, string v2, bool expected)
        {
            var e1 = new StringExtensibleEnum(v1);
            var e2 = new StringExtensibleEnum(v2);
            Assert.AreEqual(expected, e1.Equals(e2));
        }

        [TestCaseSource(nameof(ExtensibleEnumData))]
        public void ExtensibleEnumInHashSet(string[] values, int expectedCount)
        {
            var enums = values.Select(v => new StringExtensibleEnum(v));
            var set = new HashSet<StringExtensibleEnum>(enums);
            foreach (var e in enums)
            {
                Assert.IsTrue(set.Contains(e));
            }

            Assert.AreEqual(expectedCount, set.Count);
        }

        private static object[] ExtensibleEnumData = [
            new object[] {
                new string[]
                {
                    "a", "A", "foo", "fOO"
                },
                2
            }
        ];
    }
}
