namespace Sample.Models
{
    public class ExternalBase
    {
        public ExternalBase(string value)
        {
        }
    }

    public class DerivedModel : ExternalBase
    {
        public DerivedModel(string value) : base(value)
        {
        }
    }
}
