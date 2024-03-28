// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel;
using Azure.Core;

namespace NamespaceForEnums
{
    [CodeGenModel("DaysOfWeek")]
    internal partial struct CustomDaysOfWeek
    {
        [CodeGenMember("Monday")]
        public static CustomDaysOfWeek FancyMonday { get; } = new CustomDaysOfWeek(FancyMondayValue);
        [CodeGenMember("Tuesday")]
        public static CustomDaysOfWeek FancyTuesday { get; } = new CustomDaysOfWeek(FancyTuesdayValue);

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;
        /// <inheritdoc />
        public override string ToString() => _value;
    }
}
