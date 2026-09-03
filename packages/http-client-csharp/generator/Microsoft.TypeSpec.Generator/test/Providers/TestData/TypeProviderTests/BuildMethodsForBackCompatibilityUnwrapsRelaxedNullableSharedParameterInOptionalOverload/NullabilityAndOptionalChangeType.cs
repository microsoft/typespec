namespace Sample.Models
{
    public readonly partial struct FileFormatType
    {
    }
}

namespace Test
{
    public class NullabilityAndOptionalChangeType
    {
        public string GetData(string data, global::Sample.Models.FileFormatType? value = default) => null;
    }
}
