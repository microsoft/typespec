import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model A {
  @field(1) a: string;
}

model B {
  @field(1) b: string;
}

union Payment {
  @field(10) card: A,
  @field(11) bank_transfer: B,
}

union DuplicateVariants {
  @field(1) a: A,
  @field(1) b: B,
}

@reserve(2, "b")
union ReservedVariants {
  @field(1) a: A,
  @field(2) b: B,
}

@message
model Valid {
  @field(1) id: string;
  payment?: Payment;
}

@message
model IndexCollision {
  @field(10) id: string;
  payment?: Payment;
}

@message
model IndexCollisionAfter {
  payment?: Payment;
  @field(11) id: string;
}

@reserve(10, #[11, 12], "card")
@message
model Reserved {
  payment?: Payment;
}

@message
model NameCollision {
  @field(1) card: string;
  payment?: Payment;
}

@message
model OneOfNameCollision {
  card?: Payment;
}

@message
model UsedTwice {
  first?: Payment;
  second?: Payment;
}

@message
model DuplicateFields {
  @field(1) a: string;
  @field(1) b: string;
}

@message
model DuplicateWrapperVariants {
  @field(1) value: DuplicateVariants;
}

@message
model ReservedWrapperVariants {
  @field(1) value: ReservedVariants;
}
