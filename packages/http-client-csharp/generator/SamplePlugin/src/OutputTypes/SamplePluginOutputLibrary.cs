// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel;
namespace SamplePlugin
{
    public class SamplePluginOutputLibrary : ScmOutputLibrary
    {
        protected override IEnumerable<SamplePluginOutputLibraryVisitor> GetOutputLibraryVisitors() => [new SamplePluginOutputLibraryVisitor()];
    }
}
