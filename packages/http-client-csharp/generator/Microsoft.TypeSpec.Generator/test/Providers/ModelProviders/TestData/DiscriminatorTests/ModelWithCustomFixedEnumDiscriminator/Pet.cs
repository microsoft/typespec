#nullable disable

using System;
using SampleTypeSpec;

namespace Sample.Models;

public partial class Pet
{
    // CUSTOM: Changed type from string to CustomKind.
    [CodeGenMember("Kind")]
    internal CustomKind Kind { get; set; }

    public enum CustomKind
    {
        Cat,
        Dog
    }
}
