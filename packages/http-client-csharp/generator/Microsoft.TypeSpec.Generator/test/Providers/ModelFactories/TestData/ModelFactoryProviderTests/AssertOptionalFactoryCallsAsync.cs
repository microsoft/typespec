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

        public CompatibilityModel(string id, string name, bool? enabled, int? count, object additionalBinaryDataProperties)
            => (Id, Name, Enabled) = (id, name, enabled);
    }
}

public static class Consumer
{
    public static bool Validate()
    {
        var empty = SampleNamespaceModelFactory.CompatibilityModel();
        var named = SampleNamespaceModelFactory.CompatibilityModel(enabled: true);
        var namedCurrent = SampleNamespaceModelFactory.CompatibilityModel(name: "name");
        var positional = SampleNamespaceModelFactory.CompatibilityModel("id", "name", true);
        var historical = SampleNamespaceModelFactory.CompatibilityModel("legacy", (bool?)true);
        var nullArgument = SampleNamespaceModelFactory.CompatibilityModel("id", null);
        var shortCall = SampleNamespaceModelFactory.CompatibilityModel("short");
        var reordered = SampleNamespaceModelFactory.CompatibilityModel(enabled: true, id: "named");
        return empty.Id == null && empty.Name == null && empty.Enabled == null
            && named.Enabled == true && named.Name == null
            && namedCurrent.Name == "name"
            && positional.Id == "id" && positional.Name == "name" && positional.Enabled == true
            && historical.Id == "legacy" && historical.Name == null && historical.Enabled == true
            && nullArgument.Id == "id" && nullArgument.Name == null && nullArgument.Enabled == null
            && shortCall.Id == "short" && shortCall.Name == null
            && reordered.Id == "named" && reordered.Enabled == true;
    }
}
