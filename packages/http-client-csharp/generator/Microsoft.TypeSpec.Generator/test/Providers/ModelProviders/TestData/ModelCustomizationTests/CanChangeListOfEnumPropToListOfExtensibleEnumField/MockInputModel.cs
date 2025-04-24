using System;
using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public readonly IList<MyEnum> _prop1 = new();
}

public partial struct MyEnum
{
}
