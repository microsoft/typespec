// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownCodeBlocks
{
    internal record DiagnosticScopeMethodBodyBlock(Diagnostic Diagnostic, Reference ClientDiagnosticsReference, MethodBodyStatement InnerStatement) : MethodBodyStatement;
}
