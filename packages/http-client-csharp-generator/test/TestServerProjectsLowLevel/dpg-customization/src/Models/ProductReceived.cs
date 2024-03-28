// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ComponentModel;

namespace dpg_customization_LowLevel.Models
{
    /// <summary> The ProductReceived. </summary>
    public readonly partial struct ProductReceived : IEquatable<ProductReceived>
    {
        private readonly string _value;

        /// <summary> Initializes a new instance of <see cref="ProductReceived"/>. </summary>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public ProductReceived(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        private const string RawValue = "raw";
        private const string ModelValue = "model";

        /// <summary> raw. </summary>
        public static ProductReceived Raw { get; } = new ProductReceived(RawValue);
        /// <summary> model. </summary>
        public static ProductReceived Model { get; } = new ProductReceived(ModelValue);
        /// <summary> Determines if two <see cref="ProductReceived"/> values are the same. </summary>
        public static bool operator ==(ProductReceived left, ProductReceived right) => left.Equals(right);
        /// <summary> Determines if two <see cref="ProductReceived"/> values are not the same. </summary>
        public static bool operator !=(ProductReceived left, ProductReceived right) => !left.Equals(right);
        /// <summary> Converts a string to a <see cref="ProductReceived"/>. </summary>
        public static implicit operator ProductReceived(string value) => new ProductReceived(value);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ProductReceived other && Equals(other);
        /// <inheritdoc />
        public bool Equals(ProductReceived other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;
        /// <inheritdoc />
        public override string ToString() => _value;
    }
}
