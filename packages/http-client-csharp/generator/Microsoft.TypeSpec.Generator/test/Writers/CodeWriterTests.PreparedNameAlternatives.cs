// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    // Output mechanics only. Synthetic spellings/ranges are owned fixture data,
    // not permissions, source occurrences, or an admitted body consumer.
    [TestFixture]
    internal class PreparedNameAlternativesMechanicsTests
    {
        [SetUp]
        public void SetUp() => MockHelpers.LoadMockGenerator(includeXmlDocs: true);

        [TestCase(true, true, "[F|B|G|C]")]
        [TestCase(true, false, "[F|global::N.B|G|global::N.C]")]
        [TestCase(false, true, "[global::N.F|B|global::N.G|C]")]
        [TestCase(false, false, "[global::N.F|global::N.B|global::N.G|global::N.C]")]
        public void OwnedInterleavedRangesSelectExactBytes(bool fieldAllowed, bool bodyAllowed, string expected)
        {
            const string original = "[F|B|G|C]";
            const string qualified = "[global::N.F|global::N.B|global::N.G|global::N.C]";
            var alternatives = ImmutableArray.Create(
                new PreparedNameAlternative(1, 11, "F", PreparedNameChannel.Field),
                new PreparedNameAlternative(13, 11, "B", PreparedNameChannel.Body),
                new PreparedNameAlternative(25, 11, "G", PreparedNameChannel.Field),
                new PreparedNameAlternative(37, 11, "C", PreparedNameChannel.Body));
            var file = new CodeFile(original, "Owned.cs", qualified, nameAlternatives: alternatives);

            // Always select on the original staged file, never on a rendered result.
            var selected = file.SelectPreparedNames(fieldAllowed, bodyAllowed);
            Assert.AreEqual(expected, selected.Content);
            Assert.AreEqual("Owned.cs", selected.Name);
            Assert.AreEqual(original, file.Content);
            Assert.AreEqual(qualified, file.QualifiedContent);
            Assert.AreEqual(qualified, file.WithoutPreparedNames().Content);
            if (fieldAllowed && bodyAllowed)
            {
                Assert.AreSame(file, selected);
            }
        }

        [TestCase("overlap", true, false)]
        [TestCase("overlap", false, true)]
        [TestCase("negative", true, false)]
        [TestCase("negative", false, true)]
        [TestCase("out-of-bounds", true, false)]
        [TestCase("out-of-bounds", false, true)]
        [TestCase("unknown-channel", true, false)]
        [TestCase("unknown-channel", false, true)]
        [TestCase("zero-length", true, false)]
        [TestCase("zero-length", false, true)]
        public void MalformedOwnedMetadataFallsBackOnMixedSelection(string defect, bool fieldAllowed, bool bodyAllowed)
        {
            const string qualified = "global::N.F|global::N.B";
            var first = new PreparedNameAlternative(0, 11, "F", PreparedNameChannel.Field);
            var second = new PreparedNameAlternative(12, 11, "B", PreparedNameChannel.Body);
            switch (defect)
            {
                case "overlap":
                    second = second with { QualifiedOffset = 10 };
                    break;
                case "negative":
                    first = first with { QualifiedOffset = -1 };
                    break;
                case "out-of-bounds":
                    second = second with { QualifiedOffset = qualified.Length };
                    break;
                case "unknown-channel":
                    second = second with { Channel = (PreparedNameChannel)99 };
                    break;
                case "zero-length":
                    second = second with { QualifiedLength = 0 };
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(defect));
            }
            var file = new CodeFile("F|B", "Malformed.cs", qualified,
                nameAlternatives: ImmutableArray.Create(first, second));

            // Independent fixtures per defect. Disabled ranges must still validate:
            // overlap also tests that a disabled field advances previousEnd.
            Assert.AreEqual(qualified, file.SelectPreparedNames(fieldAllowed, bodyAllowed).Content);
            Assert.AreEqual(qualified, file.WithoutPreparedNames().Content);
            // This intentionally bypasses unused metadata, per the actual draft API.
            Assert.AreSame(file, file.SelectPreparedNames(true, true));
            Assert.AreEqual("F|B", file.Content);
            Assert.AreEqual(qualified, file.QualifiedContent);
        }

        [Test]
        public void LegacyWithoutMetadataKeepsFieldOnlySelectionAndQualifiedBytes()
        {
            const string original = "namespace N\r\n{\r\n    F value;\r\n}\r\n";
            const string qualified = "namespace N\r\n{\r\n    global::N.F value;\r\n}\r\n";
            var file = new CodeFile(original, "Legacy.cs", qualified);
            Assert.AreEqual(original, file.SelectPreparedNames(true, true).Content);
            Assert.AreEqual(original, file.SelectPreparedNames(true, false).Content);
            Assert.AreEqual(qualified, file.SelectPreparedNames(false, true).Content);
            Assert.AreEqual(qualified, file.SelectPreparedNames(false, false).Content);
            Assert.AreEqual(qualified, file.WithoutPreparedNames().Content);
            Assert.AreEqual(original, file.Content);
            Assert.AreEqual(qualified, file.QualifiedContent);

            var noCompanion = new CodeFile(original, "Unprepared.cs");
            Assert.AreSame(noCompanion, noCompanion.WithoutPreparedNames());
            Assert.AreSame(noCompanion, noCompanion.SelectPreparedNames(false, false));
            Assert.AreSame(noCompanion, noCompanion.SelectPreparedNames(false, true));
        }

        [TestCase(false, "\n")]
        [TestCase(false, "\r\n")]
        [TestCase(true, "\n")]
        [TestCase(true, "\r\n")]
        public void SingleDrainCapturesBodyOffsetsAfterIndentAndActualHeader(bool header, string newline)
        {
            using var writer = new CodeWriter();
            writer.EnableQualifiedFallback();
            writer.UseNamespace("Example.Names");
            using (writer.SetNamespace("Example.Host"))
            {
                Assert.IsTrue(writer.TryAppendPreparedBodyName("B", "global::N.B"));
                writer.AppendRaw(" first;" + newline);
                using (writer.Scope($"void M()"))
                {
                    writer.AppendRaw("// ordinary" + newline);
                    Assert.IsTrue(writer.TryAppendPreparedBodyName("C", "global::N.C"));
                    writer.AppendRaw(" second;" + newline);
                }
            }

            // Exactly one materialization. QualifiedContent is inspected afterwards.
            string content = writer.ToString(header);
            string qualified = writer.QualifiedContent!;
            var alternatives = writer.NameAlternatives;
            const string shortStart = "namespace Example.Host\n{\n";
            string shortPayload = shortStart + "    B first;" + newline +
                "    void M()\n    {\n        // ordinary" + newline +
                "        C second;" + newline + "    }\n}\n";
            string qualifiedPayload = shortStart + "    global::N.B first;" + newline +
                "    void M()\n    {\n        // ordinary" + newline +
                "        global::N.C second;" + newline + "    }\n}\n";

            // Derive the prefix from the actual output, not guessed license formatting.
            int prefixLength = qualified.Length - qualifiedPayload.Length;
            Assert.GreaterOrEqual(prefixLength, 0);
            string prefix = qualified.Substring(0, prefixLength);
            if (header)
            {
                StringAssert.Contains("// <auto-generated/>\n", prefix);
                StringAssert.Contains("using Example.Names;\n", prefix);
            }
            else
            {
                Assert.AreEqual(string.Empty, prefix);
            }
            Assert.AreEqual(prefix + shortPayload, content);
            Assert.AreEqual(prefix + qualifiedPayload, qualified);
            Assert.AreEqual(2, alternatives.Length);
            Assert.AreEqual(prefixLength + shortStart.Length + 4, alternatives[0].QualifiedOffset);
            Assert.AreEqual(PreparedNameChannel.Body, alternatives[0].Channel);
            Assert.AreEqual(PreparedNameChannel.Body, alternatives[1].Channel);
            Assert.AreEqual("B", alternatives[0].ShortSpelling);
            Assert.AreEqual("C", alternatives[1].ShortSpelling);
            Assert.AreEqual("global::N.B", qualified.Substring(alternatives[0].QualifiedOffset, alternatives[0].QualifiedLength));
            Assert.AreEqual("global::N.C", qualified.Substring(alternatives[1].QualifiedOffset, alternatives[1].QualifiedLength));

            var file = new CodeFile(content, "Captured.cs", qualified, nameAlternatives: alternatives);
            Assert.AreEqual(content, file.SelectPreparedNames(false, true).Content);
            Assert.AreEqual(content, file.SelectPreparedNames(true, true).Content);
            Assert.AreEqual(qualified, file.SelectPreparedNames(true, false).Content);
            Assert.AreEqual(qualified, file.SelectPreparedNames(false, false).Content);
            Assert.AreEqual(qualified, file.WithoutPreparedNames().Content);
        }

        [Test]
        public void RepeatedDrainsPublishIndependentOwnedFactsStartingAtZero()
        {
            using var writer = new CodeWriter();
            writer.EnableQualifiedFallback();
            writer.AppendRaw("prefix:");
            Assert.IsTrue(writer.TryAppendPreparedBodyName("B", "global::N.B"));
            string firstContent = writer.ToString(false);
            string firstQualified = writer.QualifiedContent!;
            var firstAlternatives = writer.NameAlternatives;
            Assert.AreEqual(1, firstAlternatives.Length);
            var firstFact = firstAlternatives[0];
            var firstFile = new CodeFile(firstContent, "First.cs", firstQualified, nameAlternatives: firstAlternatives);

            Assert.IsTrue(writer.TryAppendPreparedBodyName("C", "global::N.C"));
            Assert.AreEqual("C", writer.ToString(false));
            Assert.AreEqual("global::N.C", writer.QualifiedContent);
            Assert.AreEqual(1, writer.NameAlternatives.Length);
            Assert.AreEqual(0, writer.NameAlternatives[0].QualifiedOffset);
            Assert.AreEqual("C", writer.NameAlternatives[0].ShortSpelling);
            Assert.AreEqual(7, firstFact.QualifiedOffset);
            Assert.AreEqual(firstFact, firstAlternatives[0]);
            Assert.AreEqual("B", firstAlternatives[0].ShortSpelling);
            Assert.AreEqual("prefix:B", firstFile.SelectPreparedNames(false, true).Content);
            Assert.AreEqual("prefix:global::N.B", firstFile.SelectPreparedNames(true, false).Content);

            Assert.AreEqual(string.Empty, writer.ToString(false));
            Assert.AreEqual(string.Empty, writer.QualifiedContent);
            Assert.IsTrue(writer.NameAlternatives.IsEmpty);
            Assert.AreEqual(firstFact, firstAlternatives[0]);
            writer.Dispose();
            Assert.AreEqual(firstFact, firstAlternatives[0]);
        }

        [Test]
        public void RepeatedAndLateEnableThrowWithoutDroppingPrefix()
        {
            using var enabled = new CodeWriter();
            enabled.EnableQualifiedFallback();
            enabled.AppendRaw("prefix:");
            Assert.Throws<InvalidOperationException>(() => enabled.EnableQualifiedFallback());
            Assert.IsTrue(enabled.TryAppendPreparedBodyName("B", "global::N.B"));
            Assert.AreEqual("prefix:B", enabled.ToString(false));
            Assert.AreEqual("prefix:global::N.B", enabled.QualifiedContent);

            using var late = new CodeWriter();
            late.AppendRaw("prefix:");
            Assert.Throws<InvalidOperationException>(() => late.EnableQualifiedFallback());
            late.AppendRaw("suffix");
            Assert.AreEqual("prefix:suffix", late.ToString(false));
            Assert.IsNull(late.QualifiedContent);
            // Draining does not make late enabling safe or erase the guard history.
            Assert.Throws<InvalidOperationException>(() => late.EnableQualifiedFallback());
            late.AppendRaw("second");
            Assert.AreEqual("second", late.ToString(false));
        }

        [Test]
        public void AbsentCompanionReturnsFalseAndWritesNothing()
        {
            using var writer = new CodeWriter();
            writer.AppendRaw("left|");
            Assert.IsFalse(writer.TryAppendPreparedBodyName("B", "global::N.B"));
            writer.AppendRaw("right");
            Assert.AreEqual("left|right", writer.ToString(false));
            Assert.IsNull(writer.QualifiedContent);
            Assert.IsTrue(writer.NameAlternatives.IsEmpty);
        }

        [TestCase("", "global::N.B")]
        [TestCase(" ", "global::N.B")]
        [TestCase("B C", "global::N.B")]
        [TestCase("B\t", "global::N.B")]
        [TestCase("B\r\n", "global::N.B")]
        [TestCase("B", "global::N. B")]
        [TestCase("B", "")]
        [TestCase("B", "B")]
        [TestCase("Long", "B")]
        public void MalformedSpellingReturnsFalseWithoutWritingEitherBuffer(string shortSpelling, string qualifiedSpelling)
        {
            using var writer = new CodeWriter();
            writer.EnableQualifiedFallback();
            writer.AppendRaw("left|");
            Assert.IsFalse(writer.TryAppendPreparedBodyName(shortSpelling, qualifiedSpelling));
            writer.AppendRaw("right");
            Assert.AreEqual("left|right", writer.ToString(false));
            Assert.AreEqual("left|right", writer.QualifiedContent);
            Assert.IsTrue(writer.NameAlternatives.IsEmpty);
        }
    }
}
