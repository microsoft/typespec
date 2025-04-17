#nullable disable

using System;
using SampleTypeSpec;

namespace Sample.Models;

public partial class Pet
{
    // CUSTOM: Changed type from string to CustomKind.
    [CodeGenMember("Kind")]
    internal string CustomName { get; set; }
}
