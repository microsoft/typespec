namespace Test
{
    /// <summary>
    /// Previous contract whose Foo method declares value-type optional parameters with literal
    /// defaults (count = 0, flag = false) in the order (count, flag). The current generation
    /// declares them in a different order with `default`-keyword defaults; restoring the order must
    /// also preserve the previously published literal default representation.
    /// </summary>
    public class CustomReorderValueTypeDefaultsType
    {
        public string Foo(int count = 0, bool flag = false) => null;
    }
}
