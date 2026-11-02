import "@typespec/protobuf";

using Protobuf;

@package({
  name: "example.orders.v1",
})
namespace Example.Orders.V1 {
  model CardPayment {
    @field(1) last_four: string;
  }

  model BankTransfer {
    @field(1) reference: string;
  }

  enum Currency {
    Unspecified: 0,
    Usd: 1,
  }

  /**
   * How an order is paid.
   */
  union Payment {
    /**
     * Paid by card.
     */
    @field(10) card: CardPayment,

    @field(11) bank_transfer: BankTransfer,
    @field(12) voucher_code: string,
    @field(13) currency: Currency,
    @field(14) placed_at: WellKnown.Timestamp,
    @field(15) external: Example.Shared.ExternalPayment,
  }

  model Order {
    @field(1) id: string;

    /**
     * The payment for this order.
     */
    payment?: Payment;

    @field(2) note?: string;
  }

  model Refund {
    @field(1) id: string;
    payment?: Payment;
  }
}

@package({
  name: "example.shared",
})
namespace Example.Shared {
  model ExternalPayment {
    @field(1) provider: string;
  }
}
