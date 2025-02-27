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
        private StringWriter? _stream;
        private Emitter? _emitter;

        public EmitterTests()
        {
        }

        [SetUp]
        public void Setup()
        {
            _stream = new StringWriter();
            Console.SetOut(_stream);
            _emitter = new Emitter();
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

            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""info"",""message"":""Test message""}}", _stream?.ToString().TrimEnd());
        }

        [TestCase]
        public void TestDebug()
        {
            _emitter?.Debug("Test message");
            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""debug"",""message"":""Test message""}}", _stream?.ToString().TrimEnd());
        }

        [TestCase]
        public void TestVerbose()
        {
            _emitter?.Verbose("Test message");
            Assert.AreEqual(@"{""method"":""trace"",""params"":{""level"":""verbose"",""message"":""Test message""}}", _stream?.ToString().TrimEnd());
        }

        [TestCase]
        public void TestReportDiagnosticWithTarget()
        {
            _emitter?.ReportDiagnostic("test-code", "Test message", "Test target");
            Assert.AreEqual(@"{""method"":""diagnostic"",""params"":{""code"":""test-code"",""message"":""Test message"",""crossLanguageDefinitionId"":""Test target""}}", _stream?.ToString().TrimEnd());
        }

        [TestCase]
        public void TestReportDiagnosticWithoutTarget()
        {
            _emitter?.ReportDiagnostic("test-code", "Test message");
            Assert.AreEqual(@"{""method"":""diagnostic"",""params"":{""code"":""test-code"",""message"":""Test message""}}", _stream?.ToString().TrimEnd());
        }
    }
}
