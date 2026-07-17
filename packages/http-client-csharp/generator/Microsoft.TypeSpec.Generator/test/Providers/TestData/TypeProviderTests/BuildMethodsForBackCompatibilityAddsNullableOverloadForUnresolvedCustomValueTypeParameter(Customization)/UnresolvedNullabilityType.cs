namespace Test
{
    public partial class UnresolvedNullabilityType
    {
        public string GetData(string data, FileFormatType value, bool? flag = default) => null;
    }
}
