namespace Sample.Models
{
    public class ExternalBase
    {
    }

    public class Outer
    {
        public class NestedBase
        {
        }
    }

    public class GenericBase<T>
    {
    }

    public class GenericArgument
    {
    }

    public partial class InaccessibleDerived : ExternalBase
    {
    }

    public partial class NestedDerived : Outer.NestedBase
    {
    }

    public partial class GenericDerived : GenericBase<GenericArgument>
    {
    }
}
