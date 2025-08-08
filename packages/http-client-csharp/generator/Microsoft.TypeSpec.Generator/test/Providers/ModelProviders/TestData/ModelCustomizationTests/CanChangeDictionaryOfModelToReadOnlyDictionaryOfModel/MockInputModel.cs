using System;
using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    public readonly IReadOnlyDictionary<string, Foo> Prop1 { get; };
}
