namespace Sample
{
    public class BicepValue<T> { }

    public class Container
    {
        public BicepValue<string> NonNullable { get; set; }
        public BicepValue<string>? Nullable { get; set; }
    }
}
