namespace Test
{
    public partial class AmbiguousOptionalityType
    {
        public string GetData(string name, int? code, string tag = default) => null;
        public string GetData(string name, long other = default) => null;
    }
}
