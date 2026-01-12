#nullable disable

using System;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

public partial class Pet
{
    // CUSTOM: Changed type from string to CustomKind.
    [CodeGenMember("Kind")]
    internal string CustomName { get; set; }
}
