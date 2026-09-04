namespace Sample.Models
{
    public class ExternalBase
    {
        public string SharedProperty { get; set; }
        private string PrivateProperty { get; set; }
    }

    public class DerivedModel : ExternalBase
    {
    }

    public class PrivatePropertyDerivedModel : ExternalBase
    {
    }
}
