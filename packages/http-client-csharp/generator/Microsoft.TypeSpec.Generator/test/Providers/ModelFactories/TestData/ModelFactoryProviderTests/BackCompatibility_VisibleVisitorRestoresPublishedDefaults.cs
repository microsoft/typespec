using Sample.Namespace;

namespace Sample.Models
{
    public partial class CompatibilityModel
    {
        public string Id { get; }
        public string Name { get; }
        public bool? Enabled { get; }
        public CompatibilityModel(string id, string name, bool? enabled, object additionalBinaryDataProperties)
            => (Id, Name, Enabled) = (id, name, enabled);
    }
}

public static class Consumer
{
    public static bool Validate()
    {
        var empty = SampleNamespaceModelFactory.CompatibilityModel();
        var named = SampleNamespaceModelFactory.CompatibilityModel(enabled: true);
        var current = SampleNamespaceModelFactory.CompatibilityModel("id", "name", true);
        return empty.Id == null && empty.Enabled == null && named.Enabled == true
            && current.Id == "id" && current.Name == "name" && current.Enabled == true;
    }
}
