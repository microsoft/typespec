// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Primitives
{
    public sealed class CodeWriterDeclaration
    {
        private Dictionary<CodeWriter.CodeScope, string> _actualNames = [];

        internal bool HasBeenDeclared(Stack<CodeWriter.CodeScope> scopes)
        {
            var top = scopes.Peek();
            foreach (var scope in scopes)
            {
                if (_actualNames.ContainsKey(scope))
                {
                    if (!ReferenceEquals(scope, top))
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
                throw new InvalidOperationException($"Declaration {RequestedName} is not initialized");

            return actualName;
        }

        internal void SetActualName(string actualName, CodeWriter.CodeScope scope)
        {
            _actualNames[scope] = actualName;
        }
    }
}
