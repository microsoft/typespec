// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// The kind of operation.
    /// </summary>
    public readonly partial struct OperationKinds : IEquatable<OperationKinds>
    {
        internal const string DefaultValue = "Default";
        internal const string LongRunningValue = "LongRunning";
        internal const string PagingValue = "Paging";

        private readonly string _value;

        /// <summary> Initializes a new instance of <see cref="OperationKinds"/>. </summary>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public OperationKinds(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        /// <summary>
        /// Default operation kind.
        /// </summary>
        public static OperationKinds Default { get; } = new OperationKinds(DefaultValue);

        /// <summary>
        /// LongRunning operation kind.
        /// </summary>
        public static OperationKinds LongRunning { get; } = new OperationKinds(LongRunningValue);

        /// <summary>
        /// Paging operation kind.
        /// </summary>
        public static OperationKinds Paging { get; } = new OperationKinds(PagingValue);

        /// <summary> Determines if two <see cref="OperationKinds"/> values are the same. </summary>
        public static bool operator ==(OperationKinds left, OperationKinds right) => left.Equals(right);
        /// <summary> Determines if two <see cref="OperationKinds"/> values are not the same. </summary>
        public static bool operator !=(OperationKinds left, OperationKinds right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="OperationKinds"/>.</summary>
        /// <param name="value">The string value to convert.</param>
        public static implicit operator OperationKinds(string value) => new(value);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object? obj) => obj is OperationKinds other && Equals(other);

        /// <inheritdoc />
        public bool Equals(OperationKinds other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;

        /// <inheritdoc />
        public override string ToString() => _value;
    }
}
