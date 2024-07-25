// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using NUnit.Framework.Internal;

namespace TestProjects.CadlRanch.Tests
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    internal class CadlRanchTestAttribute : TestAttribute, IApplyToTest
    {
        public new void ApplyToTest(Test test)
        {
            var runCadlRanchParam = TestContext.Parameters.Get("RunCadlRanch", "false");
            if (!bool.TryParse(runCadlRanchParam, out var runCadlRanch) || !runCadlRanch)
            {
                test.RunState = RunState.Ignored;
                test.Properties.Set(PropertyNames.SkipReason, "Test skipped because RunCadlRanch parameter is not set to true.");
            }
        }
    }
}
