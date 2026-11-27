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
    public Client(bool useKey) : this(useKey ? new KeyPolicy() : new TokenPolicy()) { }
    public Client(bool useKey, object credential) : this(useKey ? new KeyPolicy(new Credential()) : new TokenPolicy(credential as Credential)) { }
    public Client(bool useKey, int marker) : this(useKey ? new KeyPolicy() : new TokenPolicy()) { }
    public Client(bool useKey, bool nested) : this(useKey ? nested ? new KeyPolicy() : new TokenPolicy() : new TokenPolicy()) { }
    public Client(bool useKey, string marker) : this(useKey ? new GenericPolicy<Credential>() : new TokenPolicy()) { }
    public Client(bool useKey, long marker) : this(useKey ? (Policy)null : new TokenPolicy()) { }
    public Client(bool useKey, short marker) : this(useKey ? (Policy)default : new TokenPolicy()) { }
}

public class ShadowedClient
{
    private class Policies { }
    private class KeyPolicy { }
    private class TokenPolicy { }

    public ShadowedClient(Policy policy) { }
    public ShadowedClient(bool useKey) : this(useKey ? new global::Policies.KeyPolicy() : new global::Policies.TokenPolicy()) { }
}

public class OverloadedClient
{
    public OverloadedClient(Policy policy) { }
    public OverloadedClient(KeyPolicy policy) { }
    public OverloadedClient(bool useKey) : this(useKey ? (Policy)new KeyPolicy() : new KeyPolicy()) { }
}
