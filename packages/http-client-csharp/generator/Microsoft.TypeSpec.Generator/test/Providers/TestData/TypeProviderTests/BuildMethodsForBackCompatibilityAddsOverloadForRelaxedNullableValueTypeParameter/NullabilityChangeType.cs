namespace Sample.Models
{
    public readonly partial struct FileFormatType
    {
    }
}

namespace Test
{
    public class NullabilityChangeType
    {
        public string GetData(string data, global::Sample.Models.FileFormatType? value = default, bool? flag = default) => null;
    }
}
