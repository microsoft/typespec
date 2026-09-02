namespace Sample.Models
{
    public class ExternalBase
    {
        internal ExternalBase()
        {
        }

        public ExternalBase(string value)
        {
        }
    }

    public class DerivedModel : ExternalBase
    {
        public DerivedModel()
        {
        }
    }
}
