// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TestOutputLibrary : OutputLibrary
    {
        private readonly IEnumerable<OutputLibraryVisitor>? _visitors;
        public TestOutputLibrary(IEnumerable<OutputLibraryVisitor>? visitors = null)
        {
            _visitors = visitors;
        }

        protected internal override IEnumerable<OutputLibraryVisitor> GetOutputLibraryVisitors()
        {
            foreach (var visitor in base.GetOutputLibraryVisitors())
            {
                yield return visitor;
            }
            foreach (var visitor in _visitors ?? [])
            {
                yield return visitor;
            }
        }

        protected override TypeProvider[] BuildTypeProviders()
        {
            throw new NotImplementedException();
        }
    }
}
