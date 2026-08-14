// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class CSharpNameExtensionsTests
    {
        [TestCase("CallbackUrl", "CallbackUri")]
        [TestCase("Url", "Uri")]
        [TestCase("CallbackUrlValue", "CallbackUrlValue")]
        [TestCase("CallbackUrls", "CallbackUrls")]
        [TestCase("CallbackURL", "CallbackURL")]
        [TestCase(null, null)]
        [TestCase("", "")]
        public void TestNormalizeCSharpUrlSuffix(string name, string expected)
        {
            Assert.AreEqual(expected, name.NormalizeCSharpUrlSuffix());
        }

        [TestCaseSource(nameof(DateTimeNameTestCases))]
        public void TestNormalizeDateTimeSuffix(string name, InputType type, string expected)
        {
            Assert.AreEqual(expected, type.IsDateTimeInputType() ? name.NormalizeDateTimeSuffix() : name);
        }

        [Test]
        public void NormalizeCSharpAcronymsNormalizesDateTimeSuffixInSinglePass()
        {
            Assert.AreEqual("IPStartOn", "IpStartTime".NormalizeCSharpAcronyms(normalizeDateTimeSuffix: true));
        }

        private static IEnumerable<TestCaseData> DateTimeNameTestCases()
        {
            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);

            yield return new TestCaseData("startTime", dateTime, "startOn");
            yield return new TestCaseData("Date", InputPrimitiveType.PlainDate, "On");
            yield return new TestCaseData("date", InputPrimitiveType.PlainDate, "on");
            yield return new TestCaseData("fromTime", dateTime, "fromTime");
            yield return new TestCaseData("toDate", dateTime, "toDate");
            yield return new TestCaseData("pointInTime", dateTime, "pointInTime");
            yield return new TestCaseData("recoveryPointInTime", dateTime, "recoveryPointInTime");
            yield return new TestCaseData("startTime", InputPrimitiveType.String, "startTime");
            yield return new TestCaseData("createdAt", dateTime, "createdOn");
            yield return new TestCaseData("expiresAt", dateTime, "expiresOn");
            yield return new TestCaseData("deletedTime", dateTime, "deletedOn");
            yield return new TestCaseData("finishedTime", dateTime, "finishedOn");
            yield return new TestCaseData("stateTransitionTime", dateTime, "stateTransitionOn");
            yield return new TestCaseData("notBefore", dateTime, "notBefore");
        }
    }
}
