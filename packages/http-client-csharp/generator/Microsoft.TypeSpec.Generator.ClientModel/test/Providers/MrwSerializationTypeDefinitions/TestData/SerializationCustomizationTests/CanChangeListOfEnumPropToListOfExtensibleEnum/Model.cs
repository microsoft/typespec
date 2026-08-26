using System;
using System.Collections.Generic;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

public partial class Model
{
    [CodeGenMember("Prop1")]
    public IList<MyEnum> Prop1 { get; set; }
}

public partial struct MyEnum
{
}
