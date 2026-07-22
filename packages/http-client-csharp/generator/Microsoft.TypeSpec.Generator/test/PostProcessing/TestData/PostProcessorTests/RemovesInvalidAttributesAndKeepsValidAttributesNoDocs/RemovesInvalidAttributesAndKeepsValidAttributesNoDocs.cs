using System;
using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Model))]
    [ModelReaderWriterBuildable(typeof(object))]
    public class KeepMe
    {
        public void Foo() => Console.WriteLine("hello");
    }
}
