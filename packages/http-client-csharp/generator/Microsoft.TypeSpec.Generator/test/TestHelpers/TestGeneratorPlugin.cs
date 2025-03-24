// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator;

public class TestGeneratorPlugin : GeneratorPlugin
{
    private readonly IEnumerable<LibraryVisitor> _visitors;

    public TestGeneratorPlugin(IEnumerable<LibraryVisitor> visitors)
    {
        _visitors = visitors;
    }

    public override void Apply(CodeModelGenerator generator)
    {
        foreach (var visitor in _visitors)
        {
            generator.AddVisitor(visitor);
        }
    }
}
