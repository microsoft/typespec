namespace Sample.Models
{
    public partial class PreviousBase
    {
        public System.Collections.Generic.IDictionary<string, string> AdditionalProperties { get; }
    }

    public partial class DerivedModel : PreviousBase
    {
    }
}
