// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    internal class LiteralExpressionTests
    {
        [TestCase((uint)42, "42U")]
        [TestCase(uint.MaxValue, "4294967295U")]
        public void Write_UInt(uint value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase((ulong)42, "42UL")]
        [TestCase(ulong.MaxValue, "18446744073709551615UL")]
        public void Write_ULong(ulong value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase((byte)0, "0")]
        [TestCase((byte)42, "42")]
        [TestCase(byte.MaxValue, "255")]
        public void Write_Byte(byte value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase((sbyte)42, "42")]
        [TestCase((sbyte)-42, "-42")]
        [TestCase(sbyte.MinValue, "-128")]
        public void Write_SByte(sbyte value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase((short)42, "42")]
        [TestCase((short)-42, "-42")]
        [TestCase(short.MinValue, "-32768")]
        public void Write_Short(short value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase((ushort)42, "42U")]
        [TestCase(ushort.MaxValue, "65535U")]
        public void Write_UShort(ushort value, string expected)
        {
            var expression = new LiteralExpression(value);
            using var writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }
    }
}
