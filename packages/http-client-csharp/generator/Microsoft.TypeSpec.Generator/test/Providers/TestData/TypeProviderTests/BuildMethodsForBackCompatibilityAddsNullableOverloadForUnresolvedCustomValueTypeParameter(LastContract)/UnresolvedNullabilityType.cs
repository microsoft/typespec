namespace Sample.Models
{
    public readonly partial struct FileFormatType
    {
    }
}

namespace Test
{
    public class UnresolvedNullabilityType
    {
        public string GetData(string data, global::Sample.Models.FileFormatType? value = default, bool? flag = default) => null;
    }
}
