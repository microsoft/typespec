// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public static class ClientProviderTestsUtils
    {
        public record ExpectedCSharpType
        {
            public string Name { get; }

            public string Namespace { get; }

            public bool IsFrameworkType { get; }

            public Type FrameworkType => _frameworkType ?? throw new InvalidOperationException();

            public bool IsNullable { get; }

            private readonly Type? _frameworkType;

            public ExpectedCSharpType(Type frameworkType, bool isNullable)
            {
                _frameworkType = frameworkType;
                IsFrameworkType = true;
                IsNullable = isNullable;
                Name = frameworkType.Name;
                Namespace = frameworkType.Namespace!;
            }

            public ExpectedCSharpType(string name, string ns, bool isNullable)
            {
                IsFrameworkType = false;
                IsNullable = isNullable;
                Name = name;
                Namespace = ns;
            }

            public static implicit operator ExpectedCSharpType(CSharpType type)
            {
                if (type.IsFrameworkType)
                {
                    return new(type.FrameworkType, type.IsNullable);
                }
                else
                {
                    return new(type.Name, type.Namespace, type.IsNullable);
                }
            }
        }

        public record ExpectedFieldProvider(FieldModifiers Modifiers, ExpectedCSharpType Type, string Name);

        internal static void AssertCSharpTypeAreEqual(ExpectedCSharpType expected, CSharpType type)
        {
            if (expected.IsFrameworkType)
            {
                Assert.IsTrue(type.IsFrameworkType);
                Assert.AreEqual(expected.FrameworkType, type.FrameworkType);
            }
            else
            {
                Assert.IsFalse(type.IsFrameworkType);
                Assert.AreEqual(expected.Name, type.Name);
                Assert.AreEqual(expected.Namespace, type.Namespace);
            }
            Assert.AreEqual(expected.IsNullable, type.IsNullable);
        }

        internal static void AssertFieldAreEqual(ExpectedFieldProvider expected, FieldProvider field)
        {
            Assert.AreEqual(expected.Name, field.Name);
            AssertCSharpTypeAreEqual(expected.Type, field.Type);
            Assert.AreEqual(expected.Modifiers, field.Modifiers);
        }

        internal static void AssertHasFields(TypeProvider provider, IReadOnlyList<ExpectedFieldProvider> expectedFields)
        {
            var fields = provider.Fields;

            // validate the length of the result
            Assert.GreaterOrEqual(fields.Count, expectedFields.Count);

            // validate each of them
            var fieldDict = fields.ToDictionary(f => f.Name);
            for (int i = 0; i < expectedFields.Count; i++)
            {
                var expected = expectedFields[i];

                Assert.IsTrue(fieldDict.TryGetValue(expected.Name, out var actual), $"Field {expected.Name} not present");
                AssertFieldAreEqual(expected, actual!);
            }
        }
    }
}
