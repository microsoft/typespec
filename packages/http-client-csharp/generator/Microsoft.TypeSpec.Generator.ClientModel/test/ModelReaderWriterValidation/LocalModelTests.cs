// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation
{
    public abstract class LocalModelTests<T> : ModelTests<T>
         where T : IPersistableModel<T>
    {
        [TestCase("J")]
        [TestCase("W")]
        public void RoundTripWithModelReaderWriter(string format)
            => RoundTripWithModelReaderWriterBase(format);

        [TestCase("J")]
        [TestCase("W")]
        public void RoundTripWithModelReaderWriterNonGeneric(string format)
            => RoundTripWithModelReaderWriterNonGenericBase(format);

        [TestCase("J")]
        [TestCase("W")]
        public void RoundTripWithModelInterface(string format)
            => RoundTripWithModelInterfaceBase(format);

        [TestCase("J")]
        [TestCase("W")]
        public void RoundTripWithModelInterfaceNonGeneric(string format)
            => RoundTripWithModelInterfaceNonGenericBase(format);

        [TestCase("W")]
        public void RoundTripWithModelCast(string format)
            => RoundTripWithModelCastBase(format);

        [Test]
        public void ThrowsIfUnknownFormat()
            => ThrowsIfUnknownFormatBase();

        [Test]
        public void ThrowsIfWireIsNotJson()
            => ThrowsIfWireIsNotJsonBase();
    }
}
