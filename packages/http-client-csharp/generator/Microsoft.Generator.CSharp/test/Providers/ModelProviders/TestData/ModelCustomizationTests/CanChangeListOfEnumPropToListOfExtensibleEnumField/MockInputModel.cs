using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public readonly IList<MyEnum> _prop1 = new();
}

public partial struct MyEnum
{
}
