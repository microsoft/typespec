// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    public class Diagnostic
    {
        public Diagnostic(string scopeName, DiagnosticAttribute[]? attributes = null)
        {
            ScopeName = scopeName;
            Attributes = attributes ?? Array.Empty<DiagnosticAttribute>();
        }

        public string ScopeName { get; }
        public DiagnosticAttribute[] Attributes { get; }
    }
}
