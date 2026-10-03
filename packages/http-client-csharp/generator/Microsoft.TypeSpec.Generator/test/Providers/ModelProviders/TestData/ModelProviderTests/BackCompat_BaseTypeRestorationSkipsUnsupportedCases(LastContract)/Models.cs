namespace Sample.Models
{
    public class PreviousBase
    {
        public string Id { get; set; }
    }

    public class MissingBase
    {
    }

    public class CustomizedDerived : PreviousBase
    {
    }

    public class CollisionDerived : PreviousBase
    {
    }

    public class MemberBaseDerived : PreviousBase
    {
    }

    public class CustomBaseDerived : PreviousBase
    {
    }

    public class UnavailableDerived : MissingBase
    {
    }
}
