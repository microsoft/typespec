#nullable disable

public class Consumer
{
    public static void NamedAndNull(string id = null, string name = null, string kind = null, bool? enabled = null, string description = null)
    {
    }

    public static void NamedAndNull(string id, string name, bool? enabled, string description, string kind)
    {
    }

    public static void Implicit(NewTarget value, string optional = null)
    {
    }

    public static void Implicit(OldTarget value, string optional)
    {
    }

    public static void Inapplicable(string value = null)
    {
    }

    public static void Inapplicable(bool first, int second, params int[] rest)
    {
    }

    public static void ByRef(string value = null)
    {
    }

    public static void ByRef(ref string value)
    {
    }

    public static void Call()
    {
        NamedAndNull(id: "id", name: "name", kind: "kind");
        NamedAndNull("id", "name", null);
        Implicit(new Source());
        Inapplicable();
        ByRef();
    }
}

public class OldTarget
{
}

public class NewTarget
{
}

public class Source
{
    public static implicit operator OldTarget(Source value) => new OldTarget();
    public static implicit operator NewTarget(Source value) => new NewTarget();
}
