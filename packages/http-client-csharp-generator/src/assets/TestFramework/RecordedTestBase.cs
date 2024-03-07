// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Azure.Core.TestFramework
{
    [TestFixture(true)] // this is only mocking the RecordedTestBase to make sure the test could properly run and skip
    public abstract class RecordedTestBase<TEnvironment> where TEnvironment : TestEnvironment, new()
    {
        protected RecordedTestBase(bool isAsync, RecordedTestMode? mode = null)
        {
        }

        public T InstrumentClientOptions<T>(T clientOptions) where T : ClientOptions
        {
            return clientOptions;
        }

        public TClient InstrumentClient<TClient>(TClient client) where TClient : class => client;
    }
}
