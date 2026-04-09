#nullable disable

using System;
using System.ComponentModel;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [Obsolete("This property is now deprecated.")]
        [EditorBrowsable(EditorBrowsableState.Never)]
        public string Prop1 { get; set; }
    }
}
