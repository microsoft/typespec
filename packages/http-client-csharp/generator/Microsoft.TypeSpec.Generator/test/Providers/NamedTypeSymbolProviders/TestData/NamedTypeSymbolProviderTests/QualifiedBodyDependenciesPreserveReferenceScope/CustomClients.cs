// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public class RelativeClient
    {
        public object Create() => new TestClient.GetItemsCollectionResult();
    }

    public class AbsoluteClient
    {
        public object Create() => new global::TestClient.GetItemsCollectionResult();
    }

    public class ResolvedClient
    {
        public object Create() => new External.TestClient.GetItemsCollectionResult();
    }

    public class ResolvedQualifierClient
    {
        public object Create() => new External.OtherClient.GetItemsCollectionResult();
    }
}

namespace Sample.Child
{
    public class ParentScopeClient
    {
        public object Create() => new TestClient.GetItemsCollectionResult();
    }
}

namespace External
{
    public class TestClient
    {
        public class GetItemsCollectionResult { }
    }

    public class OtherClient { }
}
