// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// The kind of operation.
    /// </summary>
    public readonly partial struct InputOperationKinds : IEquatable<InputOperationKinds>
    {
        internal const string DefaultValue = "Default";
        internal const string LongRunningValue = "LongRunning";
        internal const string PagingValue = "Paging";

        private readonly string _value;

        /// <summary> Initializes a new instance of <see cref="InputOperationKinds"/>. </summary>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public InputOperationKinds(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        /// <summary>
        /// Default operation kind.
        /// </summary>
        public static InputOperationKinds Default { get; } = new InputOperationKinds(DefaultValue);

        /// <summary>
        /// LongRunning operation kind.
        /// </summary>
        public static InputOperationKinds LongRunning { get; } = new InputOperationKinds(LongRunningValue);

        /// <summary>
        /// Paging operation kind.
        /// </summary>
        public static InputOperationKinds Paging { get; } = new InputOperationKinds(PagingValue);

        /// <summary> Determines if two <see cref="InputOperationKinds"/> values are the same. </summary>
        public static bool operator ==(InputOperationKinds left, InputOperationKinds right) => left.Equals(right);
        /// <summary> Determines if two <see cref="InputOperationKinds"/> values are not the same. </summary>
        public static bool operator !=(InputOperationKinds left, InputOperationKinds right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="InputOperationKinds"/>.</summary>
        /// <param name="value">The string value to convert.</param>
        public static implicit operator InputOperationKinds(string value) => new(value);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object? obj) => obj is InputOperationKinds other && Equals(other);

        /// <inheritdoc />
        public bool Equals(InputOperationKinds other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;

        /// <inheritdoc />
        public override string ToString() => _value;
    }
}
