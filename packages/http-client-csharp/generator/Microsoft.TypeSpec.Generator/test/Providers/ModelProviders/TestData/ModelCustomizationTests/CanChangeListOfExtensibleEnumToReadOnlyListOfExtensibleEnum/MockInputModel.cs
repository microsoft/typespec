using System;
using System.Collections.Generic;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

public partial class MockInputModel
{
    public readonly IReadOnlyList<Foo> Prop1 { get; };
}

[CodeGenType("MyEnum")]
public partial struct Foo { }
