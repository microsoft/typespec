import "./common.tsp";

namespace MyOrg.Accounts;

using MyOrg.Types;

model Account {
  id: id;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;

  // Use imported type by name only when using `using`
  ssn: ssn;

  // Or use the fully qualified name
  email: MyOrg.Types.email;

  balance: Amount;
}

model Amount {
  value: decimal128;
  currency: Currency;
}

// Create your own error types by extending the Error type
model AccountError is Error<"duplicate-account" | "invalid-account">;

op createAccount(account: Account): Account;

op charge(accountId: id, amount: Amount): void | AccountError;
