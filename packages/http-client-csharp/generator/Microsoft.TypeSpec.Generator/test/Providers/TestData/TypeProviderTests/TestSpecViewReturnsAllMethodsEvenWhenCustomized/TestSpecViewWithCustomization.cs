#nullable disable

using System;

namespace Test;

public partial class TestSpecViewWithCustomization
{
    // Customized method - should be filtered from regular Methods but not from SpecView
    public void Method1() { }
}

