import "@typespec/protobuf";

using Protobuf;

@package({
  name: "A",
})
namespace A {
  model CardPayment {
    @field(1) last_four: string;
  }

  model BankTransfer {
    @field(1) reference: string;
  }

  /**
   * A payment method.
   */
  @reserve(3, "cash")
  union Payment {
    /**
     * Paid by card.
     */
    @field(1) card: CardPayment,

    @field(2) bank_transfer: BankTransfer,
  }

  model Order {
    @field(1) id: string;
    @field(2) payment: Payment;
    @field(3) history: Payment[];
    @field(4) by_name: Map<string, Payment>;
  }

  // The same union may be used inline in one message and as a wrapper message in another.
  model Invoice {
    @field(3) id: string;
    payment?: Payment;
  }

  // Unreferenced unions marked with `@message` are emitted eagerly as wrapper messages.
  @message
  union Refund {
    @field(1) card: CardPayment,
    @field(2) note: string,
  }
}

@package({
  name: "B",
})
namespace B {
  model Checkout {
    @field(1) payment?: A.Payment;
  }
}
