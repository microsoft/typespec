namespace Sample
{
    public class BicepValue<T> { }
    public struct GenericValue<T> { }
    internal struct InternalGenericValue<T> { }

    public class Outer
    {
        public struct NestedGenericValue<T> { }
    }

    public class GenericContainer<T> where T : struct
    {
        public T? NullableValue { get; set; }
    }

    public class Container
    {
        public BicepValue<string> NonNullable { get; set; }
        public BicepValue<string>? Nullable { get; set; }
        public GenericValue<string>? NullableValue { get; set; }
        public Outer.NestedGenericValue<string>? NestedNullableValue { get; set; }
        internal InternalGenericValue<string>? InternalNullableValue { get; set; }
    }
}
