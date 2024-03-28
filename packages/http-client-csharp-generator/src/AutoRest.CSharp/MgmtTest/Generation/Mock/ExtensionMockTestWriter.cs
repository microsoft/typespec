// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.MgmtTest.Output.Mock;

namespace AutoRest.CSharp.MgmtTest.Generation.Mock
{
    internal class ExtensionMockTestWriter : MgmtMockTestBaseWriter<MgmtExtension>
    {
        public ExtensionMockTestWriter(CodeWriter writer, MgmtMockTestProvider<MgmtExtension> extensionTest) : base(writer, extensionTest)
        {
        }

        public override void Write()
        {
            // this is a sub-writer, we override this so that we no longer write the class declaration
            WriteTestMethods();
        }

        protected override void WriteTestMethodBody(MockTestCase testCase)
        {
            _writer.Line($"// Example: {testCase.Name}");

            _writer.Line();
            var extensionResourceName = WriteGetExtension(This.Target, testCase, GetArmClientExpression);

            WriteTestOperation(extensionResourceName, testCase);
        }
    }
}
