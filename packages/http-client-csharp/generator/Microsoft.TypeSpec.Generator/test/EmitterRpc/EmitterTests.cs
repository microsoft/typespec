// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.EmitterRpc
{
    public class EmitterTests
    {
        private MemoryStream? _stream;
        private Emitter? _emitter;

        public EmitterTests()
        {
        }

        [SetUp]
        public void Setup()
        {
            _stream = new MemoryStream();
            _emitter = new Emitter(_stream);
        }

        [TearDown]
        public void TearDown()
        {
            _stream?.Dispose();
            (_emitter as IDisposable)?.Dispose();
        }

        [TestCase]
        public void TestInfo()
        {
            _emitter?.Info("Test message");

            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""info"",""message"":""Test message""}}", GetResult());
        }

        [TestCase]
        public void TestDebug()
        {
            _emitter?.Debug("Test message");

            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""debug"",""message"":""Test message""}}", GetResult());
        }

        [TestCase]
        public void TestVerbose()
        {
            _emitter?.Verbose("Test message");
            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""verbose"",""message"":""Test message""}}", GetResult());
        }

        [TestCase]
        public void TestReportDiagnosticWithTarget()
        {
            _emitter?.ReportDiagnostic("test-code", "Test message", "Test target");
            Assert.AreEqual(@"{""method"":""diagnostic"",""params"":{""code"":""test-code"",""message"":""Test message"",""crossLanguageDefinitionId"":""Test target"",""severity"":""warning""}}", GetResult());
        }

        [TestCase]
        public void TestReportDiagnosticWithoutTarget()
        {
            _emitter?.ReportDiagnostic("test-code", "Test message");
            Assert.AreEqual(@"{""method"":""diagnostic"",""params"":{""code"":""test-code"",""message"":""Test message"",""severity"":""warning""}}", GetResult());
        }

        [TestCase]
        public void WriteBufferedMessages_NoBufferedMessages_WritesNothing()
        {
            _emitter?.WriteBufferedMessages();
            Assert.AreEqual(string.Empty, GetResult());
        }

        [TestCase]
        public void BufferedDebug_GroupsMessagesByCategory()
        {
            _emitter?.Debug("Reordered parameters of ClientA.DoThing.", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug("Reordered parameters of ClientB.DoOther.", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug("Preserved parameter name top on ClientA.", BackCompatibilityChangeCategory.ParameterNamePreserved);

            // Nothing should be written until WriteBufferedMessages is called.
            Assert.AreEqual(0, _stream!.Length);

            _emitter?.WriteBufferedMessages();
            var result = GetResult();
            StringAssert.Contains(@"""level"":""debug""", result);
            StringAssert.Contains("3 messages across 2 categories", result);
            StringAssert.Contains("Method Parameter Reordering (2):", result);
            StringAssert.Contains("Parameter Name Preserved (1):", result);
            StringAssert.Contains("Reordered parameters of ClientA.DoThing.", result);
            StringAssert.Contains("Reordered parameters of ClientB.DoOther.", result);
            StringAssert.Contains("Preserved parameter name top on ClientA.", result);
        }

        [TestCase]
        public void BufferedDebug_DeduplicatesIdenticalEntries()
        {
            _emitter?.Debug("same", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug("same", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug("same", BackCompatibilityChangeCategory.MethodParameterReordering);

            _emitter?.WriteBufferedMessages();
            var result = GetResult();
            StringAssert.Contains("1 message across 1 category", result);
            StringAssert.Contains("Method Parameter Reordering (1):", result);
        }

        [TestCase]
        public void BufferedDebug_IgnoresNullOrEmptyMessage()
        {
            _emitter?.Debug("", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug(null!, BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.WriteBufferedMessages();

            Assert.AreEqual(string.Empty, GetResult());
        }

        [TestCase]
        public void BufferedMessages_DifferentLevelsEmittedSeparately()
        {
            _emitter?.Info("info-msg", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.Debug("debug-msg", BackCompatibilityChangeCategory.MethodParameterReordering);

            _emitter?.WriteBufferedMessages();
            var result = GetResult();
            StringAssert.Contains(@"""level"":""info""", result);
            StringAssert.Contains(@"""level"":""debug""", result);
            StringAssert.Contains("info-msg", result);
            StringAssert.Contains("debug-msg", result);
        }

        [TestCase]
        public void WriteBufferedMessages_ClearsBuffer()
        {
            _emitter?.Debug("once", BackCompatibilityChangeCategory.MethodParameterReordering);
            _emitter?.WriteBufferedMessages();

            _stream?.SetLength(0);
            _emitter?.WriteBufferedMessages();
            Assert.AreEqual(string.Empty, GetResult());
        }

        private string GetResult()
        {
            _stream?.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(_stream!);
            return reader.ReadToEnd().TrimEnd();
        }
    }
}
