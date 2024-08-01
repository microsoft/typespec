// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TestPlugin : CodeModelPlugin
    {
        private readonly IEnumerable<LibraryVisitor>? _visitors;
        public TestPlugin(IEnumerable<LibraryVisitor>? visitors = null)
        {
            _visitors = visitors;
        }

        protected internal override IEnumerable<LibraryVisitor> GetLibraryVisitors()
        {
            foreach (var visitor in base.GetLibraryVisitors())
            {
                yield return visitor;
            }
            foreach (var visitor in _visitors ?? [])
            {
                yield return visitor;
            }
        }

    }
}
