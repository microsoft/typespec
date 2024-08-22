// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using _Type.Enum.Extensible;

namespace _Type.Enum.Extensible.Models
{
    /// <summary> Days of the week. </summary>
    public readonly partial struct DaysOfWeekExtensibleEnum : IEquatable<DaysOfWeekExtensibleEnum>
    {
        private readonly string _value;
        /// <summary> Monday. </summary>
        private const string MondayValue = "Monday";
        /// <summary> Tuesday. </summary>
        private const string TuesdayValue = "Tuesday";
        /// <summary> Wednesday. </summary>
        private const string WednesdayValue = "Wednesday";
        /// <summary> Thursday. </summary>
        private const string ThursdayValue = "Thursday";
        /// <summary> Friday. </summary>
        private const string FridayValue = "Friday";
        /// <summary> Saturday. </summary>
        private const string SaturdayValue = "Saturday";
        /// <summary> Sunday. </summary>
        private const string SundayValue = "Sunday";

        /// <summary> Initializes a new instance of <see cref="DaysOfWeekExtensibleEnum"/>. </summary>
        /// <param name="value"> The value. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public DaysOfWeekExtensibleEnum(string value)
        {
            Argument.AssertNotNull(value, nameof(value));

            _value = value;
        }

        /// <summary> Monday. </summary>
        public static DaysOfWeekExtensibleEnum Monday { get; } = new DaysOfWeekExtensibleEnum(MondayValue);

        /// <summary> Tuesday. </summary>
        public static DaysOfWeekExtensibleEnum Tuesday { get; } = new DaysOfWeekExtensibleEnum(TuesdayValue);

        /// <summary> Wednesday. </summary>
        public static DaysOfWeekExtensibleEnum Wednesday { get; } = new DaysOfWeekExtensibleEnum(WednesdayValue);

        /// <summary> Thursday. </summary>
        public static DaysOfWeekExtensibleEnum Thursday { get; } = new DaysOfWeekExtensibleEnum(ThursdayValue);

        /// <summary> Friday. </summary>
        public static DaysOfWeekExtensibleEnum Friday { get; } = new DaysOfWeekExtensibleEnum(FridayValue);

        /// <summary> Saturday. </summary>
        public static DaysOfWeekExtensibleEnum Saturday { get; } = new DaysOfWeekExtensibleEnum(SaturdayValue);

        /// <summary> Sunday. </summary>
        public static DaysOfWeekExtensibleEnum Sunday { get; } = new DaysOfWeekExtensibleEnum(SundayValue);

        /// <summary> Determines if two <see cref="DaysOfWeekExtensibleEnum"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(DaysOfWeekExtensibleEnum left, DaysOfWeekExtensibleEnum right) => left.Equals(right);

        /// <summary> Determines if two <see cref="DaysOfWeekExtensibleEnum"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(DaysOfWeekExtensibleEnum left, DaysOfWeekExtensibleEnum right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="DaysOfWeekExtensibleEnum"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator DaysOfWeekExtensibleEnum(string value) => new DaysOfWeekExtensibleEnum(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is DaysOfWeekExtensibleEnum other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(DaysOfWeekExtensibleEnum other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
