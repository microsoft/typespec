#nullable disable

using System;
using System.ComponentModel;

namespace Sample.Models
{
    public class CustomAttribute : Attribute
    {
        public CustomAttribute(string message) { }
    }

    public partial class MockInputModel
    {
        [Obsolete("This property is now deprecated.", DiagnosticId = "OBS001")]
        [EditorBrowsable(EditorBrowsableState.Never)]
        [Custom("custom message")]
        public string Prop1 { get; set; }

        [Obsolete("This field is now deprecated.")]
        private int _customField;
    }
}
