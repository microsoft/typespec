namespace Sample.Models
{
    public class PreviousBase
    {
        public PreviousBase(string name)
        {
            Name = name;
        }

        public string Name { get; set; }
    }

    public class DerivedModel : PreviousBase
    {
        public DerivedModel(string name) : base(name)
        {
        }
    }
}
