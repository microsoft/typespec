#nullable disable

using System;

namespace Test;

public partial class TestSpecViewWithCustomization
{
    // Customized property - should be filtered from regular Properties but not from SpecView
    public string Prop1 { get; set; }
}

