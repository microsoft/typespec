import "@typespec/rest";
import "@typespec/openapi";

using Http;

@service(#{ title: "sample" })
namespace Sample;

@doc("Error")
@error
model Error {
  message: string;
}

model Basic {
  @doc("Basic Id")
  id: int32 | null;

  @doc("Name property with a very long description that does not fit on a single line and a line break.")
  name: string;

  color: Colors;
}

enum Colors {
  cyan,
  Magenta,
  YELLOW,
  blacK,
}

model Pet {
  id: int32;
  name: string;
}

model IntWrapper {
  field1: int32;
  field2: int32;
}

model LongWrapper {
  field1: int64;
  field2: int64;
}

model FloatWrapper {
  field1: float32;
  field2: float32;
}

model DoubleWrapper {
  field1: float64;
  field_56_zeros_after_the_dot_and_negative_zero_before_dot_and_this_is_a_long_field_name_on_purpose: float64;
}

model BooleanWrapper {
  field_true: boolean;
  field_false: boolean;
}

model StringWrapper {
  field: string;
  empty: string;
  null: string | null;
}

model PlainDateWrapper {
  field: plainDate;
  leap: plainDate;
}

model DateTimeWrapper {
  field: utcDateTime;
  now: utcDateTime;
}

model DurationWrapper {
  field: duration;
}

model BytesWrapper {
  field: bytes;
}

model ArrayWrapper {
  field: string[];
}

model DictionaryWrapper {
  field: Record<string>;
}

model ReadonlyObj {
  @visibility(Lifecycle.Read) id: int32;
  @visibility(Lifecycle.Read) size: int32;
}

@doc("AutoRest Complex Body Test Service")
@route("/complex")
namespace Complex {
  @doc("Get complex type {id: 2, name: 'abc', color: 'YELLOW'}")
  @route("/basic/valid")
  @get
  op getValid(): Basic | Error;

  @doc("Please put {id: 2, name: 'abc', color: 'Magenta'}")
  @route("/basic/valid")
  @put
  op putValid(@body value: Basic): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with integer properties")
  @route("/primitive/integer")
  op getInt(): IntWrapper | Error;

  @doc("Put complex types with integer properties")
  @route("/primitive/integer")
  @put
  op putInt(@body value: IntWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with long properties")
  @route("/primitive/long")
  @get
  op getLong(): LongWrapper | Error;

  @doc("Put complex types with long properties")
  @route("/primitive/long")
  @put
  op putLong(@body value: LongWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with float properties")
  @route("/primitive/float")
  @get
  op getFloat(): FloatWrapper | Error;

  @doc("Put complex types with float properties")
  @route("/primitive/float")
  @put
  op putFloat(@body value: FloatWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with double properties")
  @route("/primitive/double")
  @get
  op getDouble(): DoubleWrapper | Error;

  @doc("Put complex types with double properties")
  @route("/primitive/double")
  @put
  op putDouble(@body value: DoubleWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with bool properties")
  @route("/primitive/bool")
  @get
  op getBool(): BooleanWrapper | Error;

  @doc("Put complex types with bool properties")
  @route("/primitive/bool")
  @put
  op putBool(@body value: BooleanWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with string properties")
  @route("/primitive/string")
  @get
  op getString(): StringWrapper | Error;

  @doc("Put complex types with string properties")
  @route("/primitive/string")
  @put
  op putString(@body value: StringWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with date properties")
  @route("/primitive/date")
  @get
  op getPlainDate(): PlainDateWrapper | Error;

  @doc("Put complex types with date properties")
  @route("/primitive/date")
  @put
  op putPlainDate(@body value: PlainDateWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with DateTime properties")
  @route("/primitive/datetime")
  @get
  op getZonedDateTime(): DateTimeWrapper | Error;

  @doc("Put complex types with DateTime properties")
  @route("/primitive/datetime")
  @put
  op putZonedDateTime(@body value: DateTimeWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with Duration properties")
  @route("/primitive/duration")
  @get
  op getZonedDuration(): DurationWrapper | Error;

  @doc("Put complex types with Duration properties")
  @route("/primitive/duration")
  @put
  op putZonedDuration(@body value: DurationWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with bytes properties")
  @route("/primitive/bytes")
  @get
  op getBytes(): BytesWrapper | Error;

  @doc("Put complex types with bytes properties")
  @route("/primitive/bytes")
  @put
  op putBytes(@body value: BytesWrapper): {
    ...Response<200>;
  } | Error;

  @doc("Get complex types with array properties")
  @route("/array/valid")
  op getArray(): ArrayWrapper | Error;

  @doc("Put complex types with array properties")
  @route("/array/valid")
  @put
  op putArray(@body value: ArrayWrapper): {
    ...Response<200>;
  } | Error;

  @route("/dictionary")
  namespace Dictionary {
    @doc("Get complex types with dictionary property")
    @route("/typed/valid")
    @get
    op getDictionary(): DictionaryWrapper | Error;

    @doc("Put complex types with dictionary property")
    @route("/typed/valid")
    @put
    op putArray(@body value: DictionaryWrapper): {
      ...Response<200>;
    } | Error;
  }
}
