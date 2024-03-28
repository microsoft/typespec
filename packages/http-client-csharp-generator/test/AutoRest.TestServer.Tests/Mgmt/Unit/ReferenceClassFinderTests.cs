// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Mgmt.Decorator;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt
{
    public class ReferenceClassFinderTests
    {
        private class ReferenceTypeAttribute : Attribute { }

        private class A { }
        private class B : A { }
        private class C : B { }
        private class D { }
        private class E : D { }
        [ReferenceType]
        private class F { }
        private class G : F { }
        private class H : F { }

        private static object[] TestReferenceTypes =
        {
            new Type[] { typeof(A), typeof(B), typeof(C), typeof(E), typeof(D), typeof(G), typeof(F) },
            new Type[] { typeof(A), typeof(B), typeof(C), typeof(E), typeof(D), typeof(G), typeof(H), typeof(F) }
        };

        [TestCaseSource(nameof(TestReferenceTypes))]
        public void ValidateRootNodes(params Type[] referenceTypes)
        {
            var rootNodes = ReferenceClassFinder.GetRootNodes(new List<Type>(referenceTypes));
            HashSet<Type> rootTypes = new HashSet<Type>();
            foreach (var node in rootNodes)
            {
                rootTypes.Add(node.Type);
            }
            Assert.AreEqual(3, rootNodes.Count);
            Assert.IsTrue(rootTypes.Contains(typeof(A)), "Did not find type A in the root list");
            Assert.IsTrue(rootTypes.Contains(typeof(D)), "Did not find type D in the root list");
            Assert.IsTrue(rootTypes.Contains(typeof(F)), "Did not find type F<int> in the root list");
        }
    }
}
