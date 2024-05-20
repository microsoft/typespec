// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    public class DiagnosticScope : IDisposable
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
                _writer.WriteLine($"{_scopeVariable}.Failed(e);");
                _writer.WriteLine($"throw;");
            }
        }
    }
}
