namespace Sample.Models
{
    public partial class PreviousBase
    {
        public string Kind { get; }
    }

    public partial class DerivedModel : PreviousBase
    {
    }
}
