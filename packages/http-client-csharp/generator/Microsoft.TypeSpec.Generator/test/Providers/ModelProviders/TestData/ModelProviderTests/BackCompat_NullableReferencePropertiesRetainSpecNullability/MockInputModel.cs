#nullable disable

using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public BinaryData Unknown { get; set; }
        public BinaryData Bytes { get; set; }
        public object Description { get; set; }
        public IReadOnlyList<string> Items { get; set; }
        public string Name { get; set; }
    }
}
