// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

namespace AutoRest.CSharp.Mgmt.Output.Models;

internal readonly struct NameSetKey
{
    public MgmtRestClient RestClient { get; }
    public Resource? Resource { get; }

    public NameSetKey(MgmtRestClient client, Resource? resource)
    {
        RestClient = client;
        Resource = resource;
    }

    public override int GetHashCode()
    {
        int hc = RestClient.GetHashCode();
        if (Resource is not null)
            hc ^= Resource.GetHashCode();
        return hc;
    }
    public override bool Equals(object? obj)
    {
        if (obj is null)
            return false;

        if (obj is not NameSetKey other)
            return false;

        bool eq = RestClient.Equals(other.RestClient);
        if (Resource is not null)
            eq &= Resource.Equals(other.Resource);

        return eq;
    }
}
