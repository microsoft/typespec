namespace Sample.Models
{
    public class DerivedModel : System.IO.BinaryReader
    {
        internal DerivedModel() : base(System.IO.Stream.Null)
        {
        }
    }
}
