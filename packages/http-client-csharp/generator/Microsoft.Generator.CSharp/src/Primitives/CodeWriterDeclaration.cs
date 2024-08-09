// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Primitives
{
    public sealed class CodeWriterDeclaration
    {
        private Dictionary<CodeWriter.CodeScope, string> _actualNames = [];
        private string? _debuggerName;

        internal bool HasBeenDeclared(Stack<CodeWriter.CodeScope> scopes)
        {
            var top = scopes.Peek();
            foreach (var scope in scopes)
            {
                if (_actualNames.ContainsKey(scope))
                {
                    if (!scope.Equals(top))
                    {
                        //move the declaration to make it easy to find
                        _actualNames.Add(top, _actualNames[scope]);
                    }
                    return true;
                }
            }
            return false;
        }

        public CodeWriterDeclaration(string name)
        {
            RequestedName = name;
        }

        public string RequestedName { get; }

        internal string GetActualName(CodeWriter.CodeScope scope)
        {
            if (!_actualNames.TryGetValue(scope, out var actualName))
                return _debuggerName ?? throw new InvalidOperationException($"Declaration {RequestedName} is not initialized");

            return actualName;
        }

        internal void SetActualName(string? actualName, CodeWriter.CodeScope scope)
        {
            var isScopeDeclared = _actualNames.ContainsKey(scope);
            if (isScopeDeclared && actualName != null)
            {
                throw new InvalidOperationException($"Declaration {_actualNames[scope]} already initialized, can't initialize it with {actualName} name.");
            }

            if (actualName is not null)
            {
                _actualNames[scope] = actualName;
            }
            else if (isScopeDeclared)
            {
                _actualNames.Remove(scope);
            }
        }

        internal void SetDebuggerName(string? debuggerName)
        {
            _debuggerName = debuggerName;
        }
    }
}
