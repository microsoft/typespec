using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

[CodeGenSuppress(
    "EffectiveNetworkSecurityGroup",
    typeof(NetworkSubResource),
    typeof(EffectiveNetworkSecurityGroupAssociation),
    typeof(IReadOnlyList<EffectiveSecurityRule>),
    typeof(string),
    typeof(IDictionary<string, BinaryData>))]
public partial class EffectiveNetworkSecurityGroup
{
    internal EffectiveNetworkSecurityGroup(
        NetworkSubResource networkSecurityGroup,
        EffectiveNetworkSecurityGroupAssociation association,
        IReadOnlyList<EffectiveSecurityRule> effectiveSecurityRules,
        string tagMap,
        IDictionary<string, BinaryData> additionalBinaryDataProperties)
    {
        NetworkSecurityGroup = networkSecurityGroup;
        Association = association;
        EffectiveSecurityRules = effectiveSecurityRules;
        TagMap = tagMap;
        _additionalBinaryDataProperties = additionalBinaryDataProperties;
    }
}
