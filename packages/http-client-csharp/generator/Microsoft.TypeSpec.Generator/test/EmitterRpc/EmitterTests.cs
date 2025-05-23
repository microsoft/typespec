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

        private string GetResult()
        {
            _stream?.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(_stream!);
            return reader.ReadToEnd().TrimEnd();
        }
    }
}
