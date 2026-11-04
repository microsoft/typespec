using Sample.Namespace;

namespace Sample.Models
{
    public partial class CompatibilityModel
    {
        public string Id { get; }
        public int Count { get; }
        public CompatibilityModel(string id, int count, object additionalBinaryDataProperties)
            => (Id, Count) = (id, count);
    }
}

public static class Consumer
{
    public static bool Validate()
    {
        var named = SampleNamespaceModelFactory.CompatibilityModel(count: 1);
        var historical = SampleNamespaceModelFactory.CompatibilityModel(2);
        var complete = SampleNamespaceModelFactory.CompatibilityModel(3, "id");
        return named.Count == 1 && named.Id == null && historical.Count == 2
            && complete.Count == 3 && complete.Id == "id";
    }
}
