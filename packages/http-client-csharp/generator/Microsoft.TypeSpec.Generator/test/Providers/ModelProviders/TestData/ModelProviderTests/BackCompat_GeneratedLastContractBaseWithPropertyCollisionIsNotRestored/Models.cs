namespace Sample.Models
{
    public partial class PreviousBase
    {
        public string SharedProperty { get; set; }
    }

    public partial class DerivedModel : PreviousBase
    {
    }
}
