#nullable disable

using SampleTypeSpec;
using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenType("DynamicModel")]
    public partial class DynamicModel
    {
        [CodeGenMember("SomeSpan")]
        public ReadOnlyMemory<byte> SomeSpan { get; set; }
    }
}
