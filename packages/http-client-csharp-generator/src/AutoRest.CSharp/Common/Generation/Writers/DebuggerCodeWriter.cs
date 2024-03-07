// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Generation.Writers
{
    internal sealed class DebuggerCodeWriter : CodeWriter, IDisposable
    {
        private readonly List<CodeWriterDeclaration> _declarations;

        public DebuggerCodeWriter()
        {
            _declarations = new List<CodeWriterDeclaration>();
        }

        public override CodeWriter Declaration(CodeWriterDeclaration declaration)
        {
            declaration.SetDebuggerName(GetTemporaryVariable(declaration.RequestedName));
            _declarations.Add(declaration);
            return Declaration(declaration.ActualName);
        }

        public void Dispose()
        {
            foreach (var declaration in _declarations)
            {
                declaration.SetDebuggerName(null);
            }
        }

        public override void Append(CodeWriterDeclaration declaration)
        {
            try
            {
                Identifier(declaration.ActualName);
            }
            catch (InvalidOperationException)
            {
                Identifier(declaration.RequestedName);
            }
        }

        public override string ToString() => ToString(false);
    }
}
