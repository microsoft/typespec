// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    internal sealed partial class CodeWriter
    {
        public sealed class CodeScope : IDisposable
        {
            private readonly CodeWriter _writer;
            private readonly string? _end;
            private readonly bool _newLine;

            internal HashSet<string> Identifiers { get; } = new();

            internal HashSet<string> AllDefinedIdentifiers { get; } = new();

            internal int Depth { get; }

            internal CodeScope(CodeWriter writer, string? end, bool newLine, int depth)
            {
                _writer = writer;
                _end = end;
                _newLine = newLine;
                Depth = depth;
            }

            public void Dispose()
            {
                if (_writer != null)
                {
                    _writer.PopScope(this);

                    if (_end != null)
                    {
                        _writer.AppendRaw(_end);
                    }

                    if (_newLine)
                    {
                        _writer.WriteLine();
                    }
                }
            }
        }
    }
}
