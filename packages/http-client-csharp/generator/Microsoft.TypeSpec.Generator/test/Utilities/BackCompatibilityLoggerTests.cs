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
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "Reordered parameters of 'ClientA.DoThing'.");
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "Reordered parameters of 'ClientB.DoOther'.");
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.ParameterNamePreserved, "Preserved parameter name 'top' on 'ClientA'.");

            Assert.IsTrue(BackCompatibilityLogger.HasChanges);

            var summary = BackCompatibilityLogger.BuildSummary();
            Assert.IsNotNull(summary);
            StringAssert.Contains("3 change(s) across 2 categories", summary);
            StringAssert.Contains("Method Parameter Reordering (2):", summary);
            StringAssert.Contains("Parameter Name Preserved (1):", summary);
            StringAssert.Contains("- Reordered parameters of 'ClientA.DoThing'.", summary);
            StringAssert.Contains("- Reordered parameters of 'ClientB.DoOther'.", summary);
            StringAssert.Contains("- Preserved parameter name 'top' on 'ClientA'.", summary);
        }

        [Test]
        public void LogChange_DeduplicatesIdenticalEntries()
        {
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "same");
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "same");
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "same");

            var summary = BackCompatibilityLogger.BuildSummary();
            Assert.IsNotNull(summary);
            StringAssert.Contains("1 change(s) across 1 categories", summary);
            StringAssert.Contains("Method Parameter Reordering (1):", summary);
        }

        [Test]
        public void LogChange_IgnoresNullOrEmptyMessage()
        {
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "");
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, null!);

            Assert.IsFalse(BackCompatibilityLogger.HasChanges);
            Assert.IsNull(BackCompatibilityLogger.BuildSummary());
        }

        [Test]
        public void Reset_ClearsRecordedChanges()
        {
            BackCompatibilityLogger.LogChange(BackCompatibilityChangeCategory.MethodParameterReordering, "message");
            Assert.IsTrue(BackCompatibilityLogger.HasChanges);

            BackCompatibilityLogger.Reset();

            Assert.IsFalse(BackCompatibilityLogger.HasChanges);
            Assert.IsNull(BackCompatibilityLogger.BuildSummary());
        }
    }
}
