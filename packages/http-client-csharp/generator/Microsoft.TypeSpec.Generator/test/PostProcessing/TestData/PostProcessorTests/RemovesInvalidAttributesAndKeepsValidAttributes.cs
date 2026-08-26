namespace Sample
{
    /// <summary>
    /// Class docs that should be kept.
    /// </summary>
    [ModelReaderWriterBuildable(typeof(object))]
    public class KeepMe
    {
        public void Foo() => Console.WriteLine("hello");
    }
}
