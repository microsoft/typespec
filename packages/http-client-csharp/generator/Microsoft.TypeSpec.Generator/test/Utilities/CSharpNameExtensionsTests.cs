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
            yield return new TestCaseData("Date", InputPrimitiveType.PlainDate, "Date");
            yield return new TestCaseData("date", InputPrimitiveType.PlainDate, "date");
            yield return new TestCaseData("Timestamp", dateTime, "Timestamp");
            yield return new TestCaseData("timestamp", dateTime, "timestamp");
            yield return new TestCaseData("fromTime", dateTime, "fromTime");
            yield return new TestCaseData("toDate", dateTime, "toDate");
            yield return new TestCaseData("pointInTime", dateTime, "pointInTime");
            yield return new TestCaseData("recoveryPointInTime", dateTime, "recoveryPointInTime");
            yield return new TestCaseData("startTime", InputPrimitiveType.String, "startTime");
            yield return new TestCaseData("createdAt", dateTime, "createdOn");
            yield return new TestCaseData("expiresAt", dateTime, "expiresOn");
            yield return new TestCaseData("deletedTime", dateTime, "deletedOn");
            yield return new TestCaseData("finishedTime", dateTime, "finishedOn");
            yield return new TestCaseData("CreationTime", dateTime, "CreatedOn");
            yield return new TestCaseData("creationTime", dateTime, "createdOn");
            yield return new TestCaseData("ExpirationDate", dateTime, "ExpiresOn");
            yield return new TestCaseData("expirationDate", dateTime, "expiresOn");
            yield return new TestCaseData("ExpirationDateTime", dateTime, "ExpiresOn");
            yield return new TestCaseData("expirationDateTime", dateTime, "expiresOn");
            yield return new TestCaseData("modelExpirationDate", dateTime, "modelExpiresOn");
            yield return new TestCaseData("AccountExpirationDate", dateTime, "AccountExpiresOn");
            yield return new TestCaseData("accountExpirationDate", dateTime, "accountExpiresOn");
            yield return new TestCaseData("AccountCreationDate", dateTime, "AccountCreatedOn");
            yield return new TestCaseData("AccessTierChangeTime", dateTime, "AccessTierChangedOn");
            yield return new TestCaseData("accessTierChangeTime", dateTime, "accessTierChangedOn");
            yield return new TestCaseData("RecreationTime", dateTime, "RecreationOn");
            yield return new TestCaseData("recreationTime", dateTime, "recreationOn");
            yield return new TestCaseData("TotalTime", dateTime, "TotalTime");
            yield return new TestCaseData("totalTime", dateTime, "totalTime");
            yield return new TestCaseData("TopicTimestamp", dateTime, "TopicTimestamp");
            yield return new TestCaseData("topicTimestamp", dateTime, "topicTimestamp");
            yield return new TestCaseData("TokenExpirationDate", dateTime, "TokenExpirationDate");
            yield return new TestCaseData("tokenExpirationDate", dateTime, "tokenExpirationDate");
            yield return new TestCaseData("FromageTime", dateTime, "FromageTime");
            yield return new TestCaseData("fromageTime", dateTime, "fromageTime");
            yield return new TestCaseData("StatusTimestamp", dateTime, "StatusTimestamp");
            yield return new TestCaseData("statusTimestamp", dateTime, "statusTimestamp");
            yield return new TestCaseData("StatusTimeStamp", dateTime, "StatusTimeStamp");
            yield return new TestCaseData("statusTimeStamp", dateTime, "statusTimeStamp");
            yield return new TestCaseData("LastSyncTimestamp", dateTime, "LastSyncOn");
            yield return new TestCaseData("lastSyncTimestamp", dateTime, "lastSyncOn");
            yield return new TestCaseData("stateTransitionTime", dateTime, "stateTransitionOn");
            yield return new TestCaseData("notBefore", dateTime, "notBefore");
        }
    }
}
