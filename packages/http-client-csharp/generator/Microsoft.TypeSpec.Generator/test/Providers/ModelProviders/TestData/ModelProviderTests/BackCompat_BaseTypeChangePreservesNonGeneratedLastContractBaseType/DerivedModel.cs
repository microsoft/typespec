namespace Sample.Models
{
    public partial class DerivedModel : System.Exception
    {
    }

    public class Outer
    {
        public class Middle
        {
            public class NestedBase
            {
            }
        }
    }

    public partial class NestedDerivedModel : Outer.Middle.NestedBase
    {
    }

    public class GenericBase<T>
    {
    }

    public partial class GenericDerivedModel : GenericBase<string>
    {
    }
}
