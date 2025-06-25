import "@typespec/http";

using Http;

@service(#{ title: "Accounting firm" })
namespace MyOrg.Accounting;

model Account {
  id: string;
  name: string;
  balance: decimal128;
}

interface Accounts {
  @route(":open") open(account: Account): void;
  @route(":close") close(id: string): void;
}
