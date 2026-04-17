// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class BackCompatibilityLoggerTests
    {
        [SetUp]
        public void Setup()
        {
            BackCompatibilityLogger.Reset();
        }

        [TearDown]
        public void TearDown()
        {
            BackCompatibilityLogger.Reset();
        }

        [Test]
        public void BuildSummary_ReturnsNullWhenNoChanges()
        {
            Assert.IsFalse(BackCompatibilityLogger.HasChanges);
            Assert.IsNull(BackCompatibilityLogger.BuildSummary());
        }

        [Test]
        public void LogChange_GroupsMessagesByCategory()
        {
            BackCompatibilityLogger.LogChange("Method Parameter Reordering", "Reordered parameters of 'ClientA.DoThing'.");
            BackCompatibilityLogger.LogChange("Method Parameter Reordering", "Reordered parameters of 'ClientB.DoOther'.");
            BackCompatibilityLogger.LogChange("Parameter Name Preserved", "Preserved parameter name 'top' on 'ClientA'.");

            Assert.IsTrue(BackCompatibilityLogger.HasChanges);

            var summary = BackCompatibilityLogger.BuildSummary();
            Assert.IsNotNull(summary);
            StringAssert.Contains("3 change(s) across 2 categor", summary);
            StringAssert.Contains("Method Parameter Reordering (2):", summary);
            StringAssert.Contains("Parameter Name Preserved (1):", summary);
            StringAssert.Contains("- Reordered parameters of 'ClientA.DoThing'.", summary);
            StringAssert.Contains("- Reordered parameters of 'ClientB.DoOther'.", summary);
            StringAssert.Contains("- Preserved parameter name 'top' on 'ClientA'.", summary);
        }

        [Test]
        public void LogChange_DeduplicatesIdenticalEntries()
        {
            BackCompatibilityLogger.LogChange("Cat", "same");
            BackCompatibilityLogger.LogChange("Cat", "same");
            BackCompatibilityLogger.LogChange("Cat", "same");

            var summary = BackCompatibilityLogger.BuildSummary();
            Assert.IsNotNull(summary);
            StringAssert.Contains("1 change(s) across 1 categor", summary);
            StringAssert.Contains("Cat (1):", summary);
        }

        [Test]
        public void LogChange_IgnoresNullOrEmptyInputs()
        {
            BackCompatibilityLogger.LogChange("", "something");
            BackCompatibilityLogger.LogChange("Cat", "");
            BackCompatibilityLogger.LogChange(null!, null!);

            Assert.IsFalse(BackCompatibilityLogger.HasChanges);
            Assert.IsNull(BackCompatibilityLogger.BuildSummary());
        }

        [Test]
        public void Reset_ClearsRecordedChanges()
        {
            BackCompatibilityLogger.LogChange("Cat", "message");
            Assert.IsTrue(BackCompatibilityLogger.HasChanges);

            BackCompatibilityLogger.Reset();

            Assert.IsFalse(BackCompatibilityLogger.HasChanges);
            Assert.IsNull(BackCompatibilityLogger.BuildSummary());
        }
    }
}
