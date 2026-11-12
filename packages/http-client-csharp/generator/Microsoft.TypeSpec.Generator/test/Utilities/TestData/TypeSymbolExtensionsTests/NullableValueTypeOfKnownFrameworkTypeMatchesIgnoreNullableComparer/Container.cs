namespace Sample
{
    public struct SampleStruct { }
    public class Container
    {
        public SampleStruct NonNullable { get; set; }
        public SampleStruct? Nullable { get; set; }
    }
}
