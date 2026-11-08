// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    [Experimental("A")]
    public class SignatureDependency
    {
    }

    [Experimental("B")]
    public class BodyDependency
    {
    }

    public class TestClient
    {
    }

    public class Consumer
    {
#pragma warning disable A, B
        public void Call(TestClient client)
        {
            client.UseDependencies(null);
        }
#pragma warning restore A, B

        public SignatureDependency Unsuppressed(SignatureDependency value)
        {
            new BodyDependency();
            return value;
        }
    }
}
