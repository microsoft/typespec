// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation
{
    /// <summary>
    /// Base class for XML model round-trip tests.
    /// Provides test cases for XML format ("X") serialization.
    /// </summary>
    public abstract class LocalModelXmlTests<T> : LocalModelTests<T> where T : IPersistableModel<T>
    {
        /// <summary>
        /// Gets the XML payload for testing.
        /// </summary>
        protected abstract string XmlPayload { get; }

        /// <summary>
        /// Override GetExpectedResult to return XmlPayload for format "X".
        /// </summary>
        protected override string GetExpectedResult(string format)
        {
            if (format == "X")
            {
                return XmlPayload;
            }
            return base.GetExpectedResult(format);
        }

        /// <summary>
        /// Override RoundTripTest to handle XML format serialization validation.
        /// For XML format, we parse and validate XML structure instead of JSON equivalency.
        /// </summary>
        protected new void RoundTripTest(string format, RoundTripStrategy<T> strategy)
        {
            if (format == "X")
            {
                // XML-specific round-trip test
                string serviceResponse = XmlPayload;
                ModelReaderWriterOptions options = new ModelReaderWriterOptions(format);

                var modelInstance = GetModelInstance();
                T model = (T)strategy.Read(serviceResponse, modelInstance, options);
                VerifyModel(model, format);

                var data = strategy.Write(model, options);
                string roundTrip = data.ToString();

                // Parse XML to ensure it's valid
                var expectedXml = XElement.Parse(serviceResponse);
                var resultXml = XElement.Parse(roundTrip);

                // Deserialize again and compare models
                T model2 = (T)strategy.Read(roundTrip, modelInstance, options);
                CompareModels(model, model2, format);
            }
            else
            {
                // For non-XML formats, use base implementation
                base.RoundTripTest(format, strategy);
            }
        }

        [Test]
        public void RoundTripWithModelReaderWriter_XML()
            => RoundTripTest("X", new ModelReaderWriterStrategy<T>());

        [Test]
        public void RoundTripWithModelReaderWriterNonGeneric_XML()
            => RoundTripTest("X", new ModelReaderWriterNonGenericStrategy<T>());

        [Test]
        public void RoundTripWithModelInterface_XML()
            => RoundTripTest("X", new ModelInterfaceStrategy<T>());

        [Test]
        public void RoundTripWithModelInterfaceNonGeneric_XML()
            => RoundTripTest("X", new ModelInterfaceAsObjectStrategy<T>());
    }
}
