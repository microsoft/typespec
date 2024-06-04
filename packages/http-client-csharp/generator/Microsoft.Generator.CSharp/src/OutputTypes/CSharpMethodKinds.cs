// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using System;
using System.ComponentModel;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents the kind of <see cref="MethodProvider"/>.
    /// </summary>
    public readonly partial struct CSharpMethodKinds : IEquatable<CSharpMethodKinds>
    {
        private const string ConvenienceValue = "Convenience";
        private const string ProtocolValue = "Protocol";
        private const string CreateMessageValue = "CreateMessage";
        private const string ConstructorValue = "Constructor";

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
        /// Constructor method kind.
        /// </summary>
        public static CSharpMethodKinds Constructor { get; } = new CSharpMethodKinds(ConstructorValue);

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
