// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.Tests;

public class TestGeneratorPlugin : GeneratorPlugin
{

    public override void Apply(CodeModelGenerator generator)
    {
        generator.AddVisitor(new TestLibraryVisitor());
    }
}
