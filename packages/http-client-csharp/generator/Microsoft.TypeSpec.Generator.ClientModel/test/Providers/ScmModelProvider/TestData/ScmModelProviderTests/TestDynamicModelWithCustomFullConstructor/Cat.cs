using System.ClientModel.Primitives;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    [CodeGenType("Cat")]
    public partial readonly struct Cat
    {
        private readonly string _someOtherField;
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
        internal Cat(bool meows, in global::System.ClientModel.Primitives.JsonPatch patch)
        {
            Meows = meows;
            _patch = patch;
            _someOtherField = "default";
        }
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
    }
}
