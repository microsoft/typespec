using System;
using System.Collections.Generic;
using System.Reflection.Metadata;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Primitives
{
    public class MethodSignatureTests
    {
        [Test]
        public void EqualityDoesNotRequireSameInstanceWhenUsingComparer()
        {
            var sig1 = new MethodSignature(
                "Foo",
                null,
                default,
                new CSharpType(typeof(int)),
                null,
                Array.Empty<ParameterProvider>());

            var sig2 = new MethodSignature(
                "Foo",
                null,
                default,
                new CSharpType(typeof(int)),
                null,
                Array.Empty<ParameterProvider>());
            var set = new HashSet<MethodSignature>(MethodSignature.ParameterAndReturnTypeEqualityComparer)
            {
                sig1,
                sig2
            };

            Assert.AreEqual(1, set.Count);
        }
    }
}


