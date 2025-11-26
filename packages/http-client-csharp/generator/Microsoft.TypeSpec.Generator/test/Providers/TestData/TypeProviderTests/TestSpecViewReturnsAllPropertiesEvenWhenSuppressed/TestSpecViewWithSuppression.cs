#nullable disable

using System;
using Microsoft.TypeSpec.Generator;
using SampleTypeSpec;

namespace Test;

// Suppressed property - should be filtered from regular Properties but not from SpecView
[CodeGenSuppress("SuppressedProp")]
public partial class TestSpecViewWithSuppression
{
}

