import "@typespec/protobuf";
import "./addressbook.tsp";

using TypeSpec.Protobuf;
using TypeSpec.Protobuf.WellKnown;

@package
namespace Example;

@Protobuf.service
interface AddressBookService {
  addPerson(@field(1) person: AddressBook.Person): Empty;
}
