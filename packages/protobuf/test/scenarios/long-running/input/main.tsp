import "@typespec/protobuf";

using Protobuf;

@package({
  name: "example",
})
namespace Library {
  model Book {
    @field(1) name: string;
    @field(2) title: string;
  }

  model ImportBooksRequest {
    @field(1) source_uri: string;
  }

  // Only `LongRunningOperation` refers to the response and metadata; they are emitted even with
  // `omit-unreachable-types`.
  model ImportBooksResponse {
    @field(1) books: Book[];
  }

  model ImportBooksMetadata {
    @field(1) common: Shared.OperationMetadata;
    @field(2) imported_count: int32;
  }

  model DeleteShelfRequest {
    @field(1) name: string;
  }

  model ArchiveShelfRequest {
    @field(1) name: string;
  }

  // AIP-151 asks for a metadata message of the operation's own, even an empty one.
  model ArchiveShelfMetadata {}

  @Protobuf.service
  interface LibraryService {
    getBook(@field(1) name: string): Book;

    /**
     * Imports books into the library.
     */
    importBooks(...ImportBooksRequest): LongRunningOperation<
      ImportBooksResponse,
      ImportBooksMetadata
    >;

    // A type in another package is fully qualified.
    deleteShelf(...DeleteShelfRequest): LongRunningOperation<
      WellKnown.Empty,
      Shared.OperationMetadata
    >;

    archiveShelf(...ArchiveShelfRequest): LongRunningOperation<Book, ArchiveShelfMetadata>;
  }
}

@package({
  name: "example.shared",
})
namespace Shared {
  model OperationMetadata {
    @field(1) create_time: WellKnown.Timestamp;
    @field(2) requested_cancellation: boolean;
  }
}
