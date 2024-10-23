// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    internal partial class CodeWriter
    {
        internal class NewInstanceScope : IDisposable
        {
            private readonly CodeWriter _writer;
            public NewInstanceScope(CodeWriter writer)
            {
                _writer = writer;
                _writer._writingNewInstance = true;
            }

            public void Dispose()
            {
                _writer._writingNewInstance = false;
            }
        }
    }
}
