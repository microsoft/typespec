import "@typespec/protobuf";

using Protobuf;

@package({
  name: "addressbook",
})
namespace AddressBook;

enum PhoneType {
  MOBILE: 0,
  HOME: 1,
  WORK: 2,
}

model PhoneNumber {
  @field(1) number: string;
  @field(2) type: PhoneType;
}

model Person {
  @field(1) name: string;
  @field(2) id: int32;
  @field(3) email: string;
  @field(4) phones: PhoneNumber[];
  @field(5) last_updated: WellKnown.Timestamp;
}
