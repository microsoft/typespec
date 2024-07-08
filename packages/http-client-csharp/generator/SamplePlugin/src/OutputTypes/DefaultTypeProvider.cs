// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;

namespace SamplePlugin
{
    public class DefaultTypeProvider : TypeProvider
    {
        public override string RelativeFilePath => "DefaultTypeProvider.cs";
        public override string Name => "DefaultTypeProvider";
    }
}
