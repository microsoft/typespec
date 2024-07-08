using System;
using System.Reflection.Metadata;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Primitives
{
    public class MethodSignatureTests
    {
        [Test]
        public void EqualityDoesNotRequireSameInstance()
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

            Assert.AreEqual(sig1, sig2);
        }
    }
}


