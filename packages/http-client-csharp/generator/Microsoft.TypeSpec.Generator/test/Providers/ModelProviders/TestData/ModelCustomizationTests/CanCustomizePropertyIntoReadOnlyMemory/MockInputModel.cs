#nullable disable

using SampleTypeSpec;
using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public ReadOnlyMemory<byte> Prop1 { get; set; }
    }
}
