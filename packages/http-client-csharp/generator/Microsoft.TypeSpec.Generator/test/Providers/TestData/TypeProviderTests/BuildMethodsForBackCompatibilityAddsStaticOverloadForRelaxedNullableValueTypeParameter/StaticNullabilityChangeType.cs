namespace Sample.Models
{
    public readonly partial struct FileFormatType
    {
    }
}

namespace Test
{
    public class StaticNullabilityChangeType
    {
        public static string GetData(string data, global::Sample.Models.FileFormatType? value = default, bool? flag = default) => null;
    }
}
