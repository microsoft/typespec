// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Policies;

namespace Policies
{
    public class Policy { }
    public class Credential { }
    public class GenericPolicy<T> : Policy { }
    public class KeyPolicy : Policy
    {
        public KeyPolicy(Credential credential = null) { }
    }
    public class TokenPolicy : Policy
    {
        public TokenPolicy(Credential credential = null) { }
    }
}

public class Client
{
    public Client(Policy policy) { }
    public Client(bool useKey) : this(useKey ? (global::Policies.Policy)new global::Policies.KeyPolicy() : new global::Policies.TokenPolicy()) { }
    public Client(bool useKey, object credential) : this(useKey ? (global::Policies.Policy)new global::Policies.KeyPolicy(new global::Policies.Credential()) : new global::Policies.TokenPolicy(credential as global::Policies.Credential)) { }
    public Client(bool useKey, int marker) : this(useKey ? ((global::Policies.Policy)new global::Policies.KeyPolicy()) : new global::Policies.TokenPolicy()) { }
    public Client(bool useKey, bool nested) : this(useKey ? (global::Policies.Policy)(nested ? (global::Policies.Policy)new global::Policies.KeyPolicy() : new global::Policies.TokenPolicy()) : new global::Policies.TokenPolicy()) { }
    public Client(bool useKey, string marker) : this(useKey ? (global::Policies.Policy)new GenericPolicy<global::Policies.Credential>() : new global::Policies.TokenPolicy()) { }
    public Client(bool useKey, long marker) : this(useKey ? (global::Policies.Policy)null : new global::Policies.TokenPolicy()) { }
    public Client(bool useKey, short marker) : this(useKey ? (global::Policies.Policy)default : new global::Policies.TokenPolicy()) { }
}

public class ShadowedClient
{
    private class Policies { }
    private class KeyPolicy { }
    private class TokenPolicy { }

    public ShadowedClient(Policy policy) { }
    public ShadowedClient(bool useKey) : this(useKey ? (global::Policies.Policy)new global::Policies.KeyPolicy() : new global::Policies.TokenPolicy()) { }
}

public class OverloadedClient
{
    public OverloadedClient(Policy policy) { }
    public OverloadedClient(KeyPolicy policy) { }
    public OverloadedClient(bool useKey) : this(useKey ? (global::Policies.Policy)new global::Policies.KeyPolicy() : new global::Policies.KeyPolicy()) { }
}
