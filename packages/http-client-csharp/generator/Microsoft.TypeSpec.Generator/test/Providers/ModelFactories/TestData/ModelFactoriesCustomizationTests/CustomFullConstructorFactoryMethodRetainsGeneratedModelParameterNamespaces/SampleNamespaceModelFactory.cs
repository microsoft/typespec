using System.Collections.Generic;
using Sample.Models;

#nullable disable

namespace Sample.Namespace;

public static partial class SampleNamespaceModelFactory
{
    public static EffectiveNetworkSecurityGroup EffectiveNetworkSecurityGroup(
        NetworkSubResource networkSecurityGroup,
        EffectiveNetworkSecurityGroupAssociation association,
        IReadOnlyList<EffectiveNetworkSecurityRule> effectiveSecurityRules)
    {
        return new EffectiveNetworkSecurityGroup(
            networkSecurityGroup,
            association,
            effectiveSecurityRules,
            tagMap: default,
            additionalBinaryDataProperties: default);
    }
}
