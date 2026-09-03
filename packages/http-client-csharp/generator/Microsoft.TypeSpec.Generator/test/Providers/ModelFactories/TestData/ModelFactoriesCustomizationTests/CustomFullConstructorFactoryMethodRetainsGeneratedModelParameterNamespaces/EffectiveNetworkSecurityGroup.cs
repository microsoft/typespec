using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;
using SampleTypeSpec;

#nullable disable

namespace Sample.Models;

[CodeGenSuppress(
    "EffectiveNetworkSecurityGroup",
    typeof(NetworkSubResource),
    typeof(EffectiveNetworkSecurityGroupAssociation),
    typeof(IList<EffectiveNetworkSecurityRule>),
    typeof(string),
    typeof(IDictionary<string, BinaryData>))]
public partial class EffectiveNetworkSecurityGroup
{
    internal EffectiveNetworkSecurityGroup(
        NetworkSubResource networkSecurityGroup,
        EffectiveNetworkSecurityGroupAssociation association,
        IReadOnlyList<EffectiveNetworkSecurityRule> effectiveSecurityRules,
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
