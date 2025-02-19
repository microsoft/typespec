// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using SampleTypeSpec.Models.Custom;

namespace SampleTypeSpec
{
    /// <summary> A factory class for creating instances of the models for mocking. </summary>
    public static partial class SampleTypeSpecModelFactory
    {
        /// <summary> A model with a few properties of literal types. </summary>
        /// <param name="requiredUnion"> required Union. </param>
        /// <param name="requiredLiteralString"> required literal string. </param>
        /// <param name="requiredNullableString"> required nullable string. </param>
        /// <param name="optionalNullableString"> required optional string. </param>
        /// <param name="requiredLiteralInt"> required literal int. </param>
        /// <param name="requiredLiteralFloat"> required literal float. </param>
        /// <param name="requiredLiteralBool"> required literal bool. </param>
        /// <param name="optionalLiteralString"> optional literal string. </param>
        /// <param name="optionalLiteralInt"> optional literal int. </param>
        /// <param name="optionalLiteralFloat"> optional literal float. </param>
        /// <param name="optionalLiteralBool"> optional literal bool. </param>
        /// <param name="requiredBadDescription"> description with xml &lt;|endoftext|&gt;. </param>
        /// <param name="optionalNullableList"> optional nullable collection. </param>
        /// <param name="requiredNullableList"> required nullable collection. </param>
        /// <param name="rename"></param>
        /// <returns> A new <see cref="SampleTypeSpec.Thing"/> instance for mocking. </returns>
        public static Thing Thing(BinaryData requiredUnion = default, ThingRequiredLiteralString requiredLiteralString = default, string requiredNullableString = default, string optionalNullableString = default, ThingRequiredLiteralInt requiredLiteralInt = default, ThingRequiredLiteralFloat requiredLiteralFloat = default, bool requiredLiteralBool = default, ThingOptionalLiteralString? optionalLiteralString = default, ThingOptionalLiteralInt? optionalLiteralInt = default, ThingOptionalLiteralFloat? optionalLiteralFloat = default, bool? optionalLiteralBool = default, string requiredBadDescription = default, IEnumerable<int> optionalNullableList = default, IEnumerable<int> requiredNullableList = default, string rename = default)
        {
            optionalNullableList ??= new ChangeTrackingList<int>();
            requiredNullableList ??= new ChangeTrackingList<int>();

            return new Thing(
                requiredUnion,
                requiredLiteralString,
                requiredNullableString,
                optionalNullableString,
                requiredLiteralInt,
                requiredLiteralFloat,
                requiredLiteralBool,
                optionalLiteralString,
                optionalLiteralInt,
                optionalLiteralFloat,
                optionalLiteralBool,
                requiredBadDescription,
                optionalNullableList?.ToList(),
                requiredNullableList?.ToList(),
                rename,
                additionalBinaryDataProperties: null);
        }

        /// <summary> this is a roundtrip model. </summary>
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
        /// <returns> A new <see cref="SampleTypeSpec.RoundTripModel"/> instance for mocking. </returns>
        public static RoundTripModel RoundTripModel(string requiredString = default, int requiredInt = default, IEnumerable<StringFixedEnum> requiredCollection = default, IDictionary<string, StringExtensibleEnum> requiredDictionary = default, Thing requiredModel = default, IntExtensibleEnum? intExtensibleEnum = default, IEnumerable<IntExtensibleEnum> intExtensibleEnumCollection = default, FloatExtensibleEnum? floatExtensibleEnum = default, FloatExtensibleEnumWithIntValue? floatExtensibleEnumWithIntValue = default, IEnumerable<FloatExtensibleEnum> floatExtensibleEnumCollection = default, FloatFixedEnum? floatFixedEnum = default, FloatFixedEnumWithIntValue? floatFixedEnumWithIntValue = default, IEnumerable<FloatFixedEnum> floatFixedEnumCollection = default, IntFixedEnum? intFixedEnum = default, IEnumerable<IntFixedEnum> intFixedEnumCollection = default, StringFixedEnum? stringFixedEnum = default, BinaryData requiredUnknown = default, BinaryData optionalUnknown = default, IDictionary<string, BinaryData> requiredRecordUnknown = default, IDictionary<string, BinaryData> optionalRecordUnknown = default, IReadOnlyDictionary<string, BinaryData> readOnlyRequiredRecordUnknown = default, IReadOnlyDictionary<string, BinaryData> readOnlyOptionalRecordUnknown = default, ModelWithRequiredNullableProperties modelWithRequiredNullable = default, BinaryData requiredBytes = default)
        {
            requiredCollection ??= new ChangeTrackingList<StringFixedEnum>();
            requiredDictionary ??= new ChangeTrackingDictionary<string, StringExtensibleEnum>();
            intExtensibleEnumCollection ??= new ChangeTrackingList<IntExtensibleEnum>();
            floatExtensibleEnumCollection ??= new ChangeTrackingList<FloatExtensibleEnum>();
            floatFixedEnumCollection ??= new ChangeTrackingList<FloatFixedEnum>();
            intFixedEnumCollection ??= new ChangeTrackingList<IntFixedEnum>();
            requiredRecordUnknown ??= new ChangeTrackingDictionary<string, BinaryData>();
            optionalRecordUnknown ??= new ChangeTrackingDictionary<string, BinaryData>();
            readOnlyRequiredRecordUnknown ??= new ChangeTrackingDictionary<string, BinaryData>();
            readOnlyOptionalRecordUnknown ??= new ChangeTrackingDictionary<string, BinaryData>();

            return new RoundTripModel(
                requiredString,
                requiredInt,
                requiredCollection?.ToList(),
                requiredDictionary,
                requiredModel,
                intExtensibleEnum,
                intExtensibleEnumCollection?.ToList(),
                floatExtensibleEnum,
                floatExtensibleEnumWithIntValue,
                floatExtensibleEnumCollection?.ToList(),
                floatFixedEnum,
                floatFixedEnumWithIntValue,
                floatFixedEnumCollection?.ToList(),
                intFixedEnum,
                intFixedEnumCollection?.ToList(),
                stringFixedEnum,
                requiredUnknown,
                optionalUnknown,
                requiredRecordUnknown,
                optionalRecordUnknown,
                readOnlyRequiredRecordUnknown,
                readOnlyOptionalRecordUnknown,
                modelWithRequiredNullable,
                requiredBytes,
                additionalBinaryDataProperties: null);
        }

        /// <summary> A model with a few required nullable properties. </summary>
        /// <param name="requiredNullablePrimitive"> required nullable primitive type. </param>
        /// <param name="requiredExtensibleEnum"> required nullable extensible enum type. </param>
        /// <param name="requiredFixedEnum"> required nullable fixed enum type. </param>
        /// <returns> A new <see cref="SampleTypeSpec.ModelWithRequiredNullableProperties"/> instance for mocking. </returns>
        public static ModelWithRequiredNullableProperties ModelWithRequiredNullableProperties(int? requiredNullablePrimitive = default, StringExtensibleEnum? requiredExtensibleEnum = default, StringFixedEnum? requiredFixedEnum = default)
        {

            return new ModelWithRequiredNullableProperties(requiredNullablePrimitive, requiredExtensibleEnum, requiredFixedEnum, additionalBinaryDataProperties: null);
        }

        /// <summary> this is not a friendly model but with a friendly name. </summary>
        /// <param name="name"> name of the NotFriend. </param>
        /// <returns> A new <see cref="Models.Custom.Friend"/> instance for mocking. </returns>
        public static Friend Friend(string name = default)
        {

            return new Friend(name, additionalBinaryDataProperties: null);
        }

        /// <summary> this is a model with a client name. </summary>
        /// <param name="name"> name of the ModelWithClientName. </param>
        /// <returns> A new <see cref="SampleTypeSpec.RenamedModelCustom"/> instance for mocking. </returns>
        public static RenamedModelCustom RenamedModelCustom(string name = default)
        {

            return new RenamedModelCustom(name, additionalBinaryDataProperties: null);
        }

        /// <summary> The ReturnsAnonymousModelResponse. </summary>
        /// <returns> A new <see cref="SampleTypeSpec.ReturnsAnonymousModelResponse"/> instance for mocking. </returns>
        public static ReturnsAnonymousModelResponse ReturnsAnonymousModelResponse()
        {

            return new ReturnsAnonymousModelResponse(additionalBinaryDataProperties: null);
        }

        /// <summary> The HeaderBugReproModel. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.HeaderBugReproModel"/> instance for mocking. </returns>
        public static HeaderBugReproModel HeaderBugReproModel(string foo = default, int bar = default)
        {

            return new HeaderBugReproModel(foo, bar, additionalBinaryDataProperties: null);
        }

        /// <summary> The Animal. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.Animal"/> instance for mocking. </returns>
        public static Animal Animal(AnimalXFoo foo = default, int bar = default)
        {

            return new Animal(foo, bar, additionalBinaryDataProperties: null);
        }

        /// <summary> The ModelWithHeaderResponse. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.ModelWithHeaderResponse"/> instance for mocking. </returns>
        public static ModelWithHeaderResponse ModelWithHeaderResponse(string foo = default, int bar = default)
        {

            return new ModelWithHeaderResponse(foo, bar, additionalBinaryDataProperties: null);
        }

        /// <summary> The ModelWithHeaderRoundTrip. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.ModelWithHeaderRoundTrip"/> instance for mocking. </returns>
        public static ModelWithHeaderRoundTrip ModelWithHeaderRoundTrip(string foo = default, int bar = default)
        {

            return new ModelWithHeaderRoundTrip(foo, bar, additionalBinaryDataProperties: null);
        }

        /// <summary> The ModelWithQueryRequest. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.ModelWithQueryRequest"/> instance for mocking. </returns>
        public static ModelWithQueryRequest ModelWithQueryRequest(string foo = default, int bar = default)
        {

            return new ModelWithQueryRequest(foo, bar, additionalBinaryDataProperties: null);
        }

        /// <summary> The ModelWithPathRequest. </summary>
        /// <param name="foo"></param>
        /// <param name="bar"></param>
        /// <returns> A new <see cref="UnbrandedTypeSpec.ModelWithPathRequest"/> instance for mocking. </returns>
        public static ModelWithPathRequest ModelWithPathRequest(string foo = default, int bar = default)
        {

            return new ModelWithPathRequest(foo, bar, additionalBinaryDataProperties: null);
        }
    }
}
