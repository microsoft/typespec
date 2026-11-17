using Sample.Models;

namespace Sample;

public static partial class SampleModelFactory
{
    // This compatibility overload must not suppress the generated four-parameter overload.
    public static EffectiveNetworkSecurityGroup EffectiveNetworkSecurityGroup(string tagMap)
        => new EffectiveNetworkSecurityGroup(null, null, null, tagMap, null);
}
