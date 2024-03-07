// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;

namespace AutoRest.CSharp.Output.Models.Serialization
{
    internal abstract record PropertySerialization
    {
        /// <summary>
        /// Name of the parameter in serialization constructor. Used in deserialization logic only
        /// </summary>
        public string SerializationConstructorParameterName { get;  }

        /// <summary>
        /// Value expression to be serialized. Used in serialization logic only.
        /// </summary>
        public TypedValueExpression Value { get; }

        /// <summary>
        /// Value expression to be enumerated over. Used in serialization logic only.
        /// </summary>
        public TypedValueExpression? EnumerableValue { get; }

        /// <summary>
        /// Name of the property in serialized string
        /// </summary>
        public string SerializedName { get; }
        /// <summary>
        /// 'Original' type of the serialized value
        /// </summary>
        public CSharpType? SerializedType { get; }

        public bool IsRequired { get; }
        public bool ShouldExcludeInWireSerialization { get; }

        public CustomSerializationHooks? SerializationHooks { get; }

        protected PropertySerialization(string parameterName, TypedValueExpression value, string serializedName, CSharpType? serializedType, bool isRequired, bool shouldExcludeInWireSerialization, TypedValueExpression? enumerableValue = null, CustomSerializationHooks? serializationHooks = null)
        {
            SerializationConstructorParameterName = parameterName;
            Value = value;
            SerializedName = serializedName;
            SerializedType = serializedType;
            IsRequired = isRequired;
            ShouldExcludeInWireSerialization = shouldExcludeInWireSerialization;
            EnumerableValue = enumerableValue;
            SerializationHooks = serializationHooks;
        }
    }
}
