namespace Sample.Models
{
    public partial class PreviousBase
    {
        public string Id { get; set; }
    }

    public partial class DerivedModel : PreviousBase
    {
        public string ChildProp { get; set; }
    }
}
