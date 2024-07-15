// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel;
namespace SamplePlugin
{
    public class SamplePluginOutputLibrary : ScmOutputLibrary
    {
        protected override OutputLibraryVisitor[] GetOutputLibraryVisitors() => [new SamplePluginOutputLibraryVisitor()];
    }
}
