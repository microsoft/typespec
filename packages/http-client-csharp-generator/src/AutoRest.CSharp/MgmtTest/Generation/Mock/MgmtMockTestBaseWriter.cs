// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Extensions;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.MgmtTest.Output.Mock;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;

namespace AutoRest.CSharp.MgmtTest.Generation.Mock
{
    internal abstract class MgmtMockTestBaseWriter<TProvider> : MgmtTestWriterBase<MgmtMockTestProvider<TProvider>> where TProvider : MgmtTypeProvider
    {
        protected MgmtMockTestBaseWriter(MgmtMockTestProvider<TProvider> provider) : base(provider)
        {
        }

        protected MgmtMockTestBaseWriter(CodeWriter writer, MgmtMockTestProvider<TProvider> provider) : base(writer, provider)
        {
        }

        protected FormattableString GetArmClientExpression => $"GetArmClient()";

        public override void Write()
        {
            using (_writer.Namespace(This.Namespace))
            {
                WriteClassDeclaration();
                using (_writer.Scope())
                {
                    WriteImplementations();
                }
            }
        }

        protected internal virtual void WriteImplementations()
        {
            WriteCtors();

            WriteTestMethods();
        }

        protected virtual void WriteCtors()
        {
            if (This.Ctor is not null)
            {
                using (_writer.WriteMethodDeclaration(This.Ctor))
                {
                    _writer.Line($"{typeof(ServicePointManager)}.ServerCertificateValidationCallback += (sender, cert, chain, sslPolicyErrors) => true;");
                    _writer.Line($"{typeof(Environment)}.SetEnvironmentVariable(\"RESOURCE_MANAGER_URL\", $\"https://localhost:8443\");");
                }
                _writer.Line();
            }
        }

        protected virtual void WriteTestMethods()
        {
            var testCaseDict = new Dictionary<MgmtClientOperation, List<MockTestCase>>();
            foreach (var testCase in This.MockTestCases)
            {
                testCaseDict.AddInList(testCase.Operation, testCase);
            }

            foreach (var testCase in This.MockTestCases.OrderBy(testCase => testCase.Operation.Name))
            {
                WriteTestMethod(testCase, testCaseDict[testCase.Operation].Count > 1);
                _writer.Line();
            }
        }

        protected virtual void WriteTestMethod(MockTestCase testCase, bool hasSuffix)
        {
            WriteTestAttribute();
            // TODO -- find a way to determine when we need to add the suffix
            using (_writer.WriteMethodDeclaration(testCase.GetMethodSignature(hasSuffix)))
            {
                WriteTestMethodBody(testCase);
            }
        }

        protected virtual void WriteTestMethodBody(MockTestCase testCase)
        {
        }

        protected void WriteTestAttribute()
        {
            _writer.UseNamespace("Azure.Core.TestFramework");
            _writer.Line($"[RecordedTest]");
        }

        protected void WriteTestOperation(CodeWriterDeclaration declaration, MockTestCase testCase)
        {
            // we will always use the Async version of methods
            if (testCase.Operation.IsPagingOperation)
            {
                _writer.Append($"await foreach (var _ in ");
                WriteTestMethodInvocation(declaration, testCase);
                using (_writer.Scope($")"))
                { }
            }
            else
            {
                _writer.Append($"await ");
                WriteTestMethodInvocation(declaration, testCase);
                _writer.LineRaw(";");
            }
        }

        protected void WriteTestMethodInvocation(CodeWriterDeclaration declaration, MockTestCase testCase)
        {
            var operation = testCase.Operation;
            var methodName = CreateMethodName(operation.Name);
            _writer.Append($"{declaration}.{methodName}(");
            foreach (var parameter in operation.MethodParameters)
            {
                if (testCase.ParameterValueMapping.TryGetValue(parameter.Name, out var parameterValue))
                {
                    _writer.AppendExampleParameterValue(parameter, parameterValue);
                    _writer.AppendRaw(",");
                }
                else if (parameter.IsPropertyBag)
                {
                    _writer.AppendExamplePropertyBagParamValue(parameter, testCase.PropertyBagParamValueMapping);
                    _writer.AppendRaw(",");
                }
            }
            _writer.RemoveTrailingComma();
            _writer.AppendRaw(")");
        }
    }
}
