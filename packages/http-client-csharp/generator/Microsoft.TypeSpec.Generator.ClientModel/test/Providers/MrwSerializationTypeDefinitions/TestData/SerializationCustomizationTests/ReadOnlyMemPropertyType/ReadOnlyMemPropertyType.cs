
using SampleTypeSpec;
using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class Model
    {
        [CodeGenMember("Prop1")]
        public ReadOnlyMemory<byte> NewProp1 { get; set; }
        [CodeGenMember("Prop2")]
        public ReadOnlyMemory<byte>? NewProp2 { get; set; }
    }
}
