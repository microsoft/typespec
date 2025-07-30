namespace Sample
{
    [ModelReaderWriterBuildable(typeof(object))]
    public class KeepMe
    {
        public void Foo() => Console.WriteLine("hello");
    }
}
