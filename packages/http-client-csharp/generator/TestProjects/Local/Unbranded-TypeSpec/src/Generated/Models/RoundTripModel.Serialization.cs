// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    /// <summary></summary>
    public partial class RoundTripModel : IJsonModel<RoundTripModel>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        /// <summary> Initializes a new instance of <see cref="RoundTripModel"/>. </summary>
        /// <param name="requiredString"> Required string, illustrating a reference type property. </param>
        /// <param name="requiredInt"> Required int, illustrating a value type property. </param>
        /// <param name="requiredCollection"> Required collection of enums. </param>
        /// <param name="requiredDictionary"> Required dictionary of enums. </param>
        /// <param name="requiredModel"> Required model. </param>
        /// <param name="intExtensibleEnum"> this is an int based extensible enum. </param>
        /// <param name="intExtensibleEnumCollection"> this is a collection of int based extensible enum. </param>
        /// <param name="floatExtensibleEnum"> this is a float based extensible enum. </param>
        /// <param name="floatExtensibleEnumWithIntValue"> this is a float based extensible enum. </param>
        /// <param name="floatExtensibleEnumCollection"> this is a collection of float based extensible enum. </param>
        /// <param name="floatFixedEnum"> this is a float based fixed enum. </param>
        /// <param name="floatFixedEnumWithIntValue"> this is a float based fixed enum. </param>
        /// <param name="floatFixedEnumCollection"> this is a collection of float based fixed enum. </param>
        /// <param name="intFixedEnum"> this is a int based fixed enum. </param>
        /// <param name="intFixedEnumCollection"> this is a collection of int based fixed enum. </param>
        /// <param name="stringFixedEnum"> this is a string based fixed enum. </param>
        /// <param name="requiredUnknown"> required unknown. </param>
        /// <param name="optionalUnknown"> optional unknown. </param>
        /// <param name="requiredRecordUnknown"> required record of unknown. </param>
        /// <param name="optionalRecordUnknown"> optional record of unknown. </param>
        /// <param name="readOnlyRequiredRecordUnknown"> required readonly record of unknown. </param>
        /// <param name="readOnlyOptionalRecordUnknown"> optional readonly record of unknown. </param>
        /// <param name="modelWithRequiredNullable"> this is a model with required nullable properties. </param>
        /// <param name="requiredBytes"> Required bytes. </param>
        /// <param name="serializedAdditionalRawData"> Keeps track of any properties unknown to the library. </param>
        internal RoundTripModel(string requiredString, int requiredInt, IList<StringFixedEnum?> requiredCollection, IDictionary<string, StringExtensibleEnum?> requiredDictionary, Thing requiredModel, IntExtensibleEnum intExtensibleEnum, IList<IntExtensibleEnum> intExtensibleEnumCollection, FloatExtensibleEnum floatExtensibleEnum, FloatExtensibleEnumWithIntValue floatExtensibleEnumWithIntValue, IList<FloatExtensibleEnum> floatExtensibleEnumCollection, FloatFixedEnum floatFixedEnum, FloatFixedEnumWithIntValue floatFixedEnumWithIntValue, IList<FloatFixedEnum> floatFixedEnumCollection, IntFixedEnum intFixedEnum, IList<IntFixedEnum> intFixedEnumCollection, StringFixedEnum? stringFixedEnum, BinaryData requiredUnknown, BinaryData optionalUnknown, IDictionary<string, BinaryData> requiredRecordUnknown, IDictionary<string, BinaryData> optionalRecordUnknown, IDictionary<string, BinaryData> readOnlyRequiredRecordUnknown, IDictionary<string, BinaryData> readOnlyOptionalRecordUnknown, ModelWithRequiredNullableProperties modelWithRequiredNullable, BinaryData requiredBytes, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            RequiredString = requiredString;
            RequiredInt = requiredInt;
            RequiredCollection = requiredCollection;
            RequiredDictionary = requiredDictionary;
            RequiredModel = requiredModel;
            IntExtensibleEnum = intExtensibleEnum;
            IntExtensibleEnumCollection = intExtensibleEnumCollection;
            FloatExtensibleEnum = floatExtensibleEnum;
            FloatExtensibleEnumWithIntValue = floatExtensibleEnumWithIntValue;
            FloatExtensibleEnumCollection = floatExtensibleEnumCollection;
            FloatFixedEnum = floatFixedEnum;
            FloatFixedEnumWithIntValue = floatFixedEnumWithIntValue;
            FloatFixedEnumCollection = floatFixedEnumCollection;
            IntFixedEnum = intFixedEnum;
            IntFixedEnumCollection = intFixedEnumCollection;
            StringFixedEnum = stringFixedEnum;
            RequiredUnknown = requiredUnknown;
            OptionalUnknown = optionalUnknown;
            RequiredRecordUnknown = requiredRecordUnknown;
            OptionalRecordUnknown = optionalRecordUnknown;
            ReadOnlyRequiredRecordUnknown = readOnlyRequiredRecordUnknown;
            ReadOnlyOptionalRecordUnknown = readOnlyOptionalRecordUnknown;
            ModelWithRequiredNullable = modelWithRequiredNullable;
            RequiredBytes = requiredBytes;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        /// <summary> Initializes a new instance of <see cref="RoundTripModel"/> for deserialization. </summary>
        internal RoundTripModel()
        {
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        void IJsonModel<RoundTripModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
        }

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        RoundTripModel IJsonModel<RoundTripModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            return new RoundTripModel();
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        BinaryData IPersistableModel<RoundTripModel>.Write(ModelReaderWriterOptions options)
        {
            return new BinaryData("IPersistableModel");
        }

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        RoundTripModel IPersistableModel<RoundTripModel>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            return new RoundTripModel();
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        string IPersistableModel<RoundTripModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }
}
