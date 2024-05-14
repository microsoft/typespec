// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using System;
using System.ComponentModel;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents the kind of <see cref="CSharpMethod"/>.
    /// </summary>
    public readonly partial struct CSharpMethodKinds : IEquatable<CSharpMethodKinds>
    {
        internal const string ConvenienceValue = "Convenience";
        internal const string ProtocolValue = "Protocol";
        internal const string CreateMessageValue = "CreateMessage";
        internal const string JsonModelSerializationValue = "JsonModelSerialization";
        internal const string JsonModelDeserializationValue = "JsonModelDeserialization";
        internal const string IModelDeserializationValue = "IModelDeserialization";
        internal const string IModelSerializationValue = "IModelSerialization";
        internal const string IModelGetFormatValue = "IModelGetFormat";

        private readonly string _value;

        /// <summary> Initializes a new instance of the <see cref="CSharpMethodKinds"/> structure.</summary>
        /// <param name="value">The string value of the instance.</param>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public CSharpMethodKinds(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        /// <summary>
        /// Convenience method kind.
        /// </summary>
        public static CSharpMethodKinds Convenience { get; } = new CSharpMethodKinds(ConvenienceValue);

        /// <summary>
        /// Protocol method kind.
        /// </summary>
        public static CSharpMethodKinds Protocol { get; } = new CSharpMethodKinds(ProtocolValue);

        /// <summary>
        /// CreateMessage method kind.
        /// </summary>
        public static CSharpMethodKinds CreateMessage { get; } = new CSharpMethodKinds(CreateMessageValue);

        /// <summary>
        /// JsonModelSerialization method kind.
        /// </summary>
        public static CSharpMethodKinds JsonModelSerialization { get; } = new CSharpMethodKinds(JsonModelSerializationValue);

        /// <summary>
        /// JsonModelDeserialization method kind.
        /// </summary>
        public static CSharpMethodKinds JsonModelDeserialization { get; } = new CSharpMethodKinds(JsonModelDeserializationValue);

        /// <summary>
        /// IModelSerialization method kind.
        /// </summary>
        public static CSharpMethodKinds IModelSerialization { get; } = new CSharpMethodKinds(IModelSerializationValue);

        /// <summary>
        /// IModelDeserialization method kind.
        /// </summary>
        public static CSharpMethodKinds IModelDeserialization { get; } = new CSharpMethodKinds(IModelDeserializationValue);

        /// <summary>
        /// IModelGetFormat method kind.
        /// </summary>
        public static CSharpMethodKinds IModelGetFormat { get; } = new CSharpMethodKinds(IModelGetFormatValue);

        /// <summary> Determines if two <see cref="CSharpMethodKinds"/> values are the same. </summary>
        public static bool operator ==(CSharpMethodKinds left, CSharpMethodKinds right) => left.Equals(right);
        /// <summary> Determines if two <see cref="CSharpMethodKinds"/> values are not the same. </summary>
        public static bool operator !=(CSharpMethodKinds left, CSharpMethodKinds right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="CSharpMethodKinds"/>.</summary>
        /// <param name="value">The string value to convert.</param>
        public static implicit operator CSharpMethodKinds(string value) => new(value);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object? obj) => obj is CSharpMethodKinds other && Equals(other);

        /// <inheritdoc />
        public bool Equals(CSharpMethodKinds other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;

        /// <inheritdoc />
        public override string ToString() => _value;
    }
}
