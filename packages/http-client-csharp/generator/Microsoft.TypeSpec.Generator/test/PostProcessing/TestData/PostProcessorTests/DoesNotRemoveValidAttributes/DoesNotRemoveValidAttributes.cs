using System;
using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    /// <summary>
    /// Class docs that should be kept.
    /// </summary>
    [ModelReaderWriterBuildable(typeof(Model))]
    public class KeepMe
    {
        public void Foo() => Console.WriteLine(""hello"");
    }
}
