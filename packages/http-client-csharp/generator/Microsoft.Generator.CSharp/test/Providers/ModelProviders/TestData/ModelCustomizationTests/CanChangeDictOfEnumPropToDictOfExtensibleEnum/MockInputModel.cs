using System;
using System.Collections.Generic;
using UnbrandedTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public IDictionary<string, MyEnum> Prop1 { get; set; }
}

public partial struct MyEnum
{
}
