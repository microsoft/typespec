// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using StubPlugin;

namespace Microsoft.Generator.CSharp.ClientModel.StubLibrary
{
    public class StubLibraryOutputLibrary : ScmOutputLibrary
    {
        protected override IEnumerable<OutputLibraryVisitor> GetOutputLibraryVisitors() => [new StubVisitor()];
    }
}
