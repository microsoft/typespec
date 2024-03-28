// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal sealed class ArmClientExtensionWriter : MgmtExtensionWriter
    {
        private ArmClientExtension This { get; }

        public ArmClientExtensionWriter(ArmClientExtension extension) : this(new CodeWriter(), extension)
        {
        }

        public ArmClientExtensionWriter(CodeWriter writer, ArmClientExtension extension) : base(writer, extension)
        {
            This = extension;
        }

        protected internal override void WriteImplementations()
        {
            base.WriteImplementations();

            foreach (var method in This.ArmResourceMethods)
            {
                _writer.WriteMethodDocumentation(method.Signature);
                _writer.WriteMethod(method);
            }
        }

        protected override void WriteMethod(MgmtClientOperation clientOperation, bool isAsync)
        {
            using (_writer.WriteCommonMethod(clientOperation.MethodSignature, null, isAsync, This.Accessibility == "public", SkipParameterValidation))
            {
                WriteMethodBodyWrapper(clientOperation.MethodSignature, isAsync, clientOperation.IsPagingOperation);
            }
            _writer.Line();
        }
    }
}
