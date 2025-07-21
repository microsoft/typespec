using System;
using System.ComponentModel;
using NUnit.Framework;

namespace TestProjects.Local.Tests
{
    public class ExtensibleEnumNullableTests
    {
        // Create a test StringExtensibleEnum that mimics the generated code with our new nullable operator
        public readonly partial struct TestStringExtensibleEnum : IEquatable<TestStringExtensibleEnum>
        {
            private readonly string _value;

            public TestStringExtensibleEnum(string value)
            {
                if (value == null) throw new ArgumentNullException(nameof(value));
                _value = value;
            }

            // Original implicit operator
            public static implicit operator TestStringExtensibleEnum(string value) => new TestStringExtensibleEnum(value);
            
            // New nullable implicit operator - this is what we want to test
            public static implicit operator TestStringExtensibleEnum?(string? value) 
            {
                if (value == null) return null;
                return new TestStringExtensibleEnum(value);
            }

            public bool Equals(TestStringExtensibleEnum other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);
            public override string ToString() => _value;
        }

        [Test]
        public void NullableImplicitOperator_WithNullString_ReturnsNull()
        {
            // This is the core test - casting null string to nullable enum should return null, not throw
            TestStringExtensibleEnum? result = (string?)null;
            Assert.IsNull(result);
        }

        [Test]
        public void NullableImplicitOperator_WithValidString_ReturnsValue()
        {
            // Test that the nullable operator works with valid strings
            TestStringExtensibleEnum? result = "test";
            Assert.IsNotNull(result);
            Assert.AreEqual("test", result!.Value.ToString());
        }

        [Test]
        public void OriginalImplicitOperator_StillWorks()
        {
            // Ensure the original operator still works for non-nullable scenarios
            TestStringExtensibleEnum result = "test";
            Assert.AreEqual("test", result.ToString());
        }

        [Test]
        public void OriginalImplicitOperator_WithNull_ThrowsException()
        {
            // The original operator should still throw with null (for backward compatibility)
            Assert.Throws<ArgumentNullException>(() => 
            {
                TestStringExtensibleEnum result = (string?)null!;
            });
        }
    }
}