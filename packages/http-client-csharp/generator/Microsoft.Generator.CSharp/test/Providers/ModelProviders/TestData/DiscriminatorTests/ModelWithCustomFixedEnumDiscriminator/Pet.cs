#nullable disable

using System;
using Microsoft.Generator.CSharp.Customization;

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
