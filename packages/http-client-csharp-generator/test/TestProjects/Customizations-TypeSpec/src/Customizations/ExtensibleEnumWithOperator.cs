// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ComponentModel;

namespace CustomizationsInTsp.Models
{
    /// <summary> Extensible enum to customize operator. </summary>
    public readonly partial struct ExtensibleEnumWithOperator : IEquatable<ExtensibleEnumWithOperator>
    {
        /// <summary> Operator customization with new implematation. </summary>
        public static bool operator ==(ExtensibleEnumWithOperator left, ExtensibleEnumWithOperator right) => left.Equals(ExtensibleEnumWithOperator.Monday);
        /// <summary> Operator customization with new implematation. </summary>
        public static bool operator !=(ExtensibleEnumWithOperator left, ExtensibleEnumWithOperator right) => !left.Equals(ExtensibleEnumWithOperator.Monday);
        /// <summary> Conversion customization with new implematation. </summary>
        public static implicit operator ExtensibleEnumWithOperator(string value) => new ExtensibleEnumWithOperator("Monday");
    }
}
