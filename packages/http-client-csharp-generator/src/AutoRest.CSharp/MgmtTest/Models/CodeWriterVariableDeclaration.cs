// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.MgmtTest.Models
{
    internal record CodeWriterVariableDeclaration(CodeWriterDeclaration Declaration, CSharpType Type)
    {
        public CodeWriterVariableDeclaration(string name, CSharpType type) : this(new CodeWriterDeclaration(name), type)
        { }
    }
}
