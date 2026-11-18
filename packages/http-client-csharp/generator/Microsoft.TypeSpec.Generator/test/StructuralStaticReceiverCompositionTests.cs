// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverComposesSeparatelyRecordedGenericChildrenWithoutChangingCapturedSource(bool captured)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock {");
                if (captured) writer.WriteLine($"public object M() => Capture({typeof(Comparer<DateTimeOffset>)}.Default);");
                else writer.WriteLine($"public object M() => {typeof(Comparer<DateTimeOffset>)}.Default;");
                writer.WriteRawLine("private object Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            Assert.That(code.TypeReferences!.Count, Is.EqualTo(2), "Receiver and generic child must both have independent writer provenance");
            var output = await Reduce(code);
            StringAssert.Contains(captured
                ? "Capture(global::System.Collections.Generic.Comparer<global::System.DateTimeOffset>.Default)"
                : "=> Comparer<DateTimeOffset>.Default", output);
            AssertStaticMemberBindings(code.Content, output);
        }
    }
}
