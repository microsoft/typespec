// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    internal partial class CodeWriter
    {
        internal class XmlDocWritingScope : IDisposable
        {
            private readonly CodeWriter _writer;
            public XmlDocWritingScope(CodeWriter writer)
            {
                _writer = writer;
                _writer._writingXmlDocumentation = true;
            }

            public void Dispose()
            {
                _writer._writingXmlDocumentation = false;
            }
        }
    }
}
