import "@typespec/http";

using TypeSpec.Http;

@service({ title: "Accounting firm", version: "1.0.0" }) namespace MyOrg.Accounting;



model Account {
    id: string;
    name: string;
    balance: decimal128;
}

interface Accounts {

    @route(":open") open(account: Account): void;
  @route(":close")     close(id: string): void;
  
}
