// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;

namespace TestProjects.CadlRanch.Tests.Infrastructure
{
    public abstract class CadlRanchModelJsonTests<T> : CadlRanchModelTests<T> where T : IJsonModel<T>
    {
        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceOfTWire()
          => RoundTripTest("W", new JsonInterfaceStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceOfTJson()
          => RoundTripTest("J", new JsonInterfaceStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceNonGenericWire()
              => RoundTripTest("W", new JsonInterfaceAsObjectStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceNonGenericJson()
              => RoundTripTest("J", new JsonInterfaceAsObjectStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceUtf8ReaderWire()
            => RoundTripTest("W", new JsonInterfaceUtf8ReaderStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceUtf8ReaderJson()
            => RoundTripTest("J", new JsonInterfaceUtf8ReaderStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceUtf8ReaderNonGenericWire()
            => RoundTripTest("W", new JsonInterfaceUtf8ReaderAsObjectStrategy<T>());

        [CadlRanchTest]
        public void RoundTripWithJsonInterfaceUtf8ReaderNonGenericJson()
            => RoundTripTest("J", new JsonInterfaceUtf8ReaderAsObjectStrategy<T>());
    }
}
