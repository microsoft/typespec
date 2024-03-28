// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class DiagnosticScopeWriter
    {
        public static IDisposable WriteDiagnosticScope(this CodeWriter writer, Diagnostic diagnostic, Reference clientDiagnostics)
        {
            var scopeVariable = new CodeWriterDeclaration("scope");
            writer.Line($"using var {scopeVariable:D} = {clientDiagnostics.GetReferenceFormattable()}.{Configuration.ApiTypes.ClientDiagnosticsCreateScopeName}({diagnostic.ScopeName:L});");
            foreach (DiagnosticAttribute diagnosticScopeAttributes in diagnostic.Attributes)
            {
                writer.Append($"{scopeVariable}.AddAttribute({diagnosticScopeAttributes.Name:L},");
                writer.WriteReferenceOrConstant(diagnosticScopeAttributes.Value);
                writer.Line($");");
            }

            writer.Line($"{scopeVariable}.Start();");
            return new DiagnosticScope(writer.Scope($"try"), scopeVariable, writer);
        }

        private class DiagnosticScope : IDisposable
        {
            private readonly CodeWriter.CodeWriterScope _scope;
            private readonly CodeWriterDeclaration _scopeVariable;
            private readonly CodeWriter _writer;

            public DiagnosticScope(CodeWriter.CodeWriterScope scope, CodeWriterDeclaration scopeVariable, CodeWriter writer)
            {
                _scope = scope;
                _scopeVariable = scopeVariable;
                _writer = writer;
            }

            public void Dispose()
            {
                _scope.Dispose();
                using (_writer.Scope($"catch ({typeof(Exception)} e)"))
                {
                    _writer.Line($"{_scopeVariable}.Failed(e);");
                    _writer.Line($"throw;");
                }
            }
        }
    }
}
