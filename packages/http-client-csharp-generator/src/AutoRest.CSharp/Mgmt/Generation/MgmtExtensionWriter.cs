// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class MgmtExtensionWriter : MgmtClientBaseWriter
    {
        public static MgmtExtensionWriter GetWriter(MgmtExtension extension) => GetWriter(new CodeWriter(), extension);

        public static MgmtExtensionWriter GetWriter(CodeWriter writer, MgmtExtension extension) => extension switch
        {
            ArmClientExtension armClientExtension => new ArmClientExtensionWriter(writer, armClientExtension),
            _ => new MgmtExtensionWriter(writer, extension)
        };

        protected override bool SkipParameterValidation => true;

        private MgmtExtension This { get; }
        protected delegate void WriteResourceGetBody(MethodSignature signature, bool isAsync, bool isPaging);

        public MgmtExtensionWriter(MgmtExtension extensions) : this(new CodeWriter(), extensions)
        {
            This = extensions;
        }

        public MgmtExtensionWriter(CodeWriter writer, MgmtExtension extensions) : base(writer, extensions)
        {
            This = extensions;
        }

        protected override WriteMethodDelegate GetMethodDelegate(bool isLongRunning, bool isPaging)
            => IsArmCore ? base.GetMethodDelegate(isLongRunning, isPaging) : GetMethodWrapperImpl;

        private void GetMethodWrapperImpl(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool isAsync)
            => WriteMethodBodyWrapper(clientOperation.MethodSignature, isAsync, clientOperation.IsPagingOperation);

        protected void WriteMethodBodyWrapper(MethodSignature signature, bool isAsync, bool isPaging)
        {
            _writer.WriteParametersValidation(signature.Parameters.Take(1));

            _writer.AppendRaw("return ")
                .AppendRawIf("await ", isAsync && !isPaging)
                .Append($"{This.MockableExtension.FactoryMethodName}({This.ExtensionParameter.Name}).{CreateMethodName(signature.Name, isAsync)}(");

            foreach (var parameter in signature.Parameters.Skip(1))
            {
                _writer.Append($"{parameter.Name},");
            }

            _writer.RemoveTrailingComma();
            _writer.AppendRaw(")")
                .AppendRawIf(".ConfigureAwait(false)", isAsync && !isPaging)
                .LineRaw(";");
        }
    }
}
