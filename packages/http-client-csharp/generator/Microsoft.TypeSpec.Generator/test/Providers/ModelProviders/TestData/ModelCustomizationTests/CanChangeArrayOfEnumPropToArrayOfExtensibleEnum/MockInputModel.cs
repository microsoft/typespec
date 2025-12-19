using System;
using System.Collections.Generic;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public MyEnum[] Prop1 { get; set; }
}

public partial struct MyEnum
{
}
