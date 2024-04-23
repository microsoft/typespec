﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DiagnosticScopeMethodBodyBlock(Diagnostic Diagnostic, Reference ClientDiagnosticsReference, MethodBodyStatement InnerStatement) : MethodBodyStatement;
}
