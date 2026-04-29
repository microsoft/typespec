// This file represents the previous (last contract) state of the model before @dynamicModel was added.
// It has AdditionalProperties but no JsonPatch, which triggers the backcompat path.

using System.Collections.Generic;

namespace Sample.Models
{
    public partial class DynamicModel
    {
        public string P1 { get; set; }

        public global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> AdditionalProperties { get; }
    }
}
