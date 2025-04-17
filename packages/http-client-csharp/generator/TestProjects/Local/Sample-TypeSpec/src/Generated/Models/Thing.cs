// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace SampleTypeSpec
{
    /// <summary> A model with a few properties of literal types. </summary>
    public partial class Thing
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        /// <summary> Initializes a new instance of <see cref="Thing"/>. </summary>
        /// <param name="requiredUnion"> required Union. </param>
        /// <param name="requiredNullableString"> required nullable string. </param>
        /// <param name="requiredBadDescription"> description with xml &lt;|endoftext|&gt;. </param>
        /// <param name="requiredNullableList"> required nullable collection. </param>
        /// <param name="rename"></param>
        /// <exception cref="ArgumentNullException"> <paramref name="requiredUnion"/>, <paramref name="requiredBadDescription"/> or <paramref name="rename"/> is null. </exception>
        public Thing(BinaryData requiredUnion, string requiredNullableString, string requiredBadDescription, IEnumerable<int> requiredNullableList, string rename)
        {
            Argument.AssertNotNull(requiredUnion, nameof(requiredUnion));
            Argument.AssertNotNull(requiredBadDescription, nameof(requiredBadDescription));
            Argument.AssertNotNull(rename, nameof(rename));

            RequiredUnion = requiredUnion;
            RequiredNullableString = requiredNullableString;
            RequiredBadDescription = requiredBadDescription;
            OptionalNullableList = new ChangeTrackingList<int>();
            RequiredNullableList = requiredNullableList?.ToList();
            Rename = rename;
        }

        internal Thing(BinaryData requiredUnion, ThingRequiredLiteralString requiredLiteralString, string requiredNullableString, string optionalNullableString, ThingRequiredLiteralInt requiredLiteralInt, ThingRequiredLiteralFloat requiredLiteralFloat, bool requiredLiteralBool, ThingOptionalLiteralString? optionalLiteralString, ThingOptionalLiteralInt? optionalLiteralInt, ThingOptionalLiteralFloat? optionalLiteralFloat, bool? optionalLiteralBool, string requiredBadDescription, IList<int> optionalNullableList, IList<int> requiredNullableList, string rename, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            RequiredUnion = requiredUnion;
            RequiredLiteralString = requiredLiteralString;
            RequiredNullableString = requiredNullableString;
            OptionalNullableString = optionalNullableString;
            RequiredLiteralInt = requiredLiteralInt;
            RequiredLiteralFloat = requiredLiteralFloat;
            RequiredLiteralBool = requiredLiteralBool;
            OptionalLiteralString = optionalLiteralString;
            OptionalLiteralInt = optionalLiteralInt;
            OptionalLiteralFloat = optionalLiteralFloat;
            OptionalLiteralBool = optionalLiteralBool;
            RequiredBadDescription = requiredBadDescription;
            OptionalNullableList = optionalNullableList;
            RequiredNullableList = requiredNullableList;
            Rename = rename;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary>
        /// required Union
        /// <para> To assign an object to this property use <see cref="BinaryData.FromObjectAsJson{T}(T, JsonSerializerOptions?)"/>. </para>
        /// <para> To assign an already formatted json string to this property use <see cref="BinaryData.FromString(string)"/>. </para>
        /// <para>
        /// <remarks>
        /// Supported types:
        /// <list type="bullet">
        /// <item>
        /// <description> <see cref="string"/>. </description>
        /// </item>
        /// <item>
        /// <description> <see cref="IList{T}"/> where <c>T</c> is of type <see cref="string"/>. </description>
        /// </item>
        /// <item>
        /// <description> <see cref="int"/>. </description>
        /// </item>
        /// </list>
        /// </remarks>
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term> BinaryData.FromObjectAsJson("foo"). </term>
        /// <description> Creates a payload of "foo". </description>
        /// </item>
        /// <item>
        /// <term> BinaryData.FromString("\"foo\""). </term>
        /// <description> Creates a payload of "foo". </description>
        /// </item>
        /// <item>
        /// <term> BinaryData.FromObjectAsJson(new { key = "value" }). </term>
        /// <description> Creates a payload of { "key": "value" }. </description>
        /// </item>
        /// <item>
        /// <term> BinaryData.FromString("{\"key\": \"value\"}"). </term>
        /// <description> Creates a payload of { "key": "value" }. </description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public BinaryData RequiredUnion { get; set; }

        /// <summary> required literal string. </summary>
        public ThingRequiredLiteralString RequiredLiteralString { get; } = "accept";

        /// <summary> required nullable string. </summary>
        public string RequiredNullableString { get; set; }

        /// <summary> required optional string. </summary>
        public string OptionalNullableString { get; set; }

        /// <summary> required literal int. </summary>
        public ThingRequiredLiteralInt RequiredLiteralInt { get; } = 123;

        /// <summary> required literal float. </summary>
        public ThingRequiredLiteralFloat RequiredLiteralFloat { get; } = 1.23F;

        /// <summary> required literal bool. </summary>
        public bool RequiredLiteralBool { get; } = false;

        /// <summary> optional literal string. </summary>
        public ThingOptionalLiteralString? OptionalLiteralString { get; set; }

        /// <summary> optional literal int. </summary>
        public ThingOptionalLiteralInt? OptionalLiteralInt { get; set; }

        /// <summary> optional literal float. </summary>
        public ThingOptionalLiteralFloat? OptionalLiteralFloat { get; set; }

        /// <summary> optional literal bool. </summary>
        public bool? OptionalLiteralBool { get; set; }

        /// <summary> description with xml &lt;|endoftext|&gt;. </summary>
        public string RequiredBadDescription { get; set; }

        /// <summary> optional nullable collection. </summary>
        public IList<int> OptionalNullableList { get; set; }

        /// <summary> required nullable collection. </summary>
        public IList<int> RequiredNullableList { get; set; }
    }
}
