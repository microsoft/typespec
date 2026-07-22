namespace Test
{
    public class AmbiguousOptionalityType
    {
        public string GetData(string name, int? code = default, string tag = default) => null;
    }
}
