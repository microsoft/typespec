// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;
using Azure.Core;
using Azure.Core.Extensions;

namespace AutoRest.CSharp.Common.Generation.Writers
{
    internal class AspDotNetExtensionWriter
    {
        private CodeWriter _writer;

        private AspDotNetExtensionTypeProvider This { get; }

        public AspDotNetExtensionWriter(AspDotNetExtensionTypeProvider aspDotNetExtension)
        {
            _writer = new CodeWriter();
            This = aspDotNetExtension;
        }

        public void Write()
        {
            using (_writer.Namespace(This.Declaration.Namespace))
            {
                WriteClassDeclaration();
                using (_writer.Scope())
                {
                    WriteImplementations();
                }
            }
        }

        private void WriteClassDeclaration()
        {
            _writer.WriteXmlDocumentationSummary(This.Description);
            _writer.AppendRaw(This.Declaration.Accessibility)
                .AppendRaw(" static")
                .Append($" partial class {This.Type.Name}");
        }

        private void WriteImplementations()
        {
            foreach (var (signature, (declarations, values)) in This.ExtesnsionMethods)
            {
                using (_writer.WriteCommonMethodWithoutValidation(signature, null, false, false))
                {
                    var builder = signature.Parameters.First();
                    var arguments = signature.ReturnType!.Arguments;
                    var clientType = arguments.First();
                    _writer.Append($"return {builder.Name:I}.RegisterClientFactory")
                        .AppendRaw("<");
                    foreach (var argument in arguments)
                    {
                        _writer.Append($"{argument},");
                    }
                    _writer.RemoveTrailingComma();
                    _writer.AppendRaw(">((");
                    foreach (var declaration in declarations)
                    {
                        _writer.Append($"{declaration},");
                    }
                    _writer.RemoveTrailingComma();
                    _writer.Append($") => new {clientType}(");
                    foreach (var value in values)
                    {
                        _writer.Append($"{value},");
                    }
                    _writer.RemoveTrailingComma();
                    _writer.LineRaw("));");
                }
                _writer.Line();
            }

            foreach (var signature in This.ExtensionMethodsWithoutCallback)
            {
                using (_writer.WriteCommonMethodWithoutValidation(signature, null, false, false))
                {
                    var builder = signature.Parameters.First();
                    var otherParameters = signature.Parameters.Skip(1);
                    _writer.Append($"return {builder.Name:I}.RegisterClientFactory")
                        .AppendRaw("<");
                    foreach (var argument in signature.ReturnType!.Arguments)
                    {
                        _writer.Append($"{argument},");
                    }
                    _writer.RemoveTrailingComma();
                    _writer.AppendRaw(">(");
                    foreach (var parameter in otherParameters)
                    {
                        _writer.Append($"{parameter.Name:I},");
                    }
                    _writer.RemoveTrailingComma();
                    _writer.LineRaw(");");
                }
            }
        }

        public override string ToString() => _writer.ToString();
    }
}
