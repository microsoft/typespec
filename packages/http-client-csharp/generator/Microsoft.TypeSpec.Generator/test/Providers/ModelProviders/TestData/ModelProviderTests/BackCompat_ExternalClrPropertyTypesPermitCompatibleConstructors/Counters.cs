using System;
using System.Collections.Generic;
using Sample.External;

namespace Sample.Models
{
    public partial class StringGenericCounter : GenericBase<string>
    {
        public StringGenericCounter(string value)
        {
            Value = value;
        }
    }

    public partial class NestedGenericCounter : GenericIntermediate<string>
    {
        public NestedGenericCounter(List<string> value)
        {
            Value = value;
        }
    }

    public partial class NullableGenericCounter : NullableGenericBase<int>
    {
        public NullableGenericCounter(int? value)
        {
            Value = value;
        }
    }

    public partial class GeneratedGenericCounter : GenericBase<ExternalValue>
    {
        public GeneratedGenericCounter(ExternalValue value)
        {
            Value = value;
        }
    }

    public partial class EnumCounter : EnumBase
    {
        public EnumCounter(ExternalKind value)
        {
            Value = value;
        }
    }

    public partial class EnumCollectionCounter : GenericBase<List<ExternalKind>>
    {
        public EnumCollectionCounter(List<ExternalKind> value)
        {
            Value = value;
        }
    }

    public partial class MismatchedGenericCounter : GenericBase<int>
    {
        public MismatchedGenericCounter(string value)
        {
            Value = int.Parse(value);
        }
    }

    public partial class MismatchedNullableCollectionCounter : GenericIntermediate<int>
    {
        public MismatchedNullableCollectionCounter(List<int?> value)
        {
            Value = value.ConvertAll(item => item.GetValueOrDefault());
        }
    }

    public partial class NullableToNonNullableCollectionCounter : GenericIntermediate<int>
    {
        public NullableToNonNullableCollectionCounter(List<int?> value)
        {
            Value = value.ConvertAll(item => item.GetValueOrDefault());
        }
    }

    public partial class NonNullableToNullableCollectionCounter : GenericIntermediate<int?>
    {
        public NonNullableToNullableCollectionCounter(List<int> value)
        {
            Value = value.ConvertAll(item => (int?)item);
        }
    }

    public partial class NullableArrayCounter : GenericBase<int?[]>
    {
        public NullableArrayCounter(int?[] value)
        {
            Value = value;
        }
    }

    public partial class NullableToDifferentNullableArrayCounter : GenericBase<int?[]>
    {
        public NullableToDifferentNullableArrayCounter(long?[] value)
        {
            Value = Array.ConvertAll(value, item => (int?)item);
        }
    }

    public partial class DifferentNullableToNullableArrayCounter : GenericBase<long?[]>
    {
        public DifferentNullableToNullableArrayCounter(int?[] value)
        {
            Value = Array.ConvertAll(value, item => (long?)item);
        }
    }

    public partial class JaggedNullableArrayCounter : GenericBase<int?[][]>
    {
        public JaggedNullableArrayCounter(int?[][] value)
        {
            Value = value;
        }
    }

    public partial class MismatchedJaggedNullableArrayCounter : GenericBase<int?[][]>
    {
        public MismatchedJaggedNullableArrayCounter(long?[][] value)
        {
            Value = Array.ConvertAll(value, items => Array.ConvertAll(items, item => (int?)item));
        }
    }

    public partial class MismatchedNestedNullableArrayCounter : GenericBase<List<int?[]>>
    {
        public MismatchedNestedNullableArrayCounter(List<long?[]> value)
        {
            Value = value.ConvertAll(items => Array.ConvertAll(items, item => (int?)item));
        }
    }

    public partial class MismatchedMappedNullableArrayCounter : GenericBase<long?[]>
    {
        public MismatchedMappedNullableArrayCounter(int?[] value)
        {
            Value = Array.ConvertAll(value, item => (long?)item);
        }
    }
}
