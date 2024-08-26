// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;

namespace TestProjects.CadlRanch.Tests.Infrastructure
{
    public abstract class CadlRanchModelTests<T> : ModelTests<T> where T : IPersistableModel<T>
    {
        [CadlRanchTest]
        public void RoundTripWithModelReaderWriterWire()
            => RoundTripWithModelReaderWriterBase("W");

        [CadlRanchTest]
        public void RoundTripWithModelReaderWriterJson()
            => RoundTripWithModelReaderWriterBase("J");

        [CadlRanchTest]
        public void RoundTripWithModelReaderWriterNonGenericWire()
            => RoundTripWithModelReaderWriterNonGenericBase("W");

        [CadlRanchTest]
        public void RoundTripWithModelReaderWriterNonGenericJson()
            => RoundTripWithModelReaderWriterNonGenericBase("J");

        [CadlRanchTest]
        public void RoundTripWithModelInterfaceWire()
            => RoundTripWithModelInterfaceBase("W");

        [CadlRanchTest]
        public void RoundTripWithModelInterfaceJson()
            => RoundTripWithModelInterfaceBase("J");

        [CadlRanchTest]
        public void RoundTripWithModelInterfaceNonGenericWire()
            => RoundTripWithModelInterfaceNonGenericBase("W");

        [CadlRanchTest]
        public void RoundTripWithModelInterfaceNonGenericJson()
            => RoundTripWithModelInterfaceNonGenericBase("J");

        [CadlRanchTest]
        public void RoundTripWithModelCast()
            => RoundTripWithModelCastBase("W");

        [CadlRanchTest]
        public void ThrowsIfUnknownFormat()
            => ThrowsIfUnknownFormatBase();

        [CadlRanchTest]
        public void ThrowsIfWireIsNotJson()
            => ThrowsIfWireIsNotJsonBase();

    }
}
