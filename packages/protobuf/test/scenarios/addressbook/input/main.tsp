import "@typespec/protobuf";
import "./addressbook.tsp";

using Protobuf;
using Protobuf.WellKnown;

@package
namespace Example;

@Protobuf.service
interface AddressBookService {
  addPerson(@field(1) person: AddressBook.Person): Empty;
}
