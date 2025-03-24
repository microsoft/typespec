//
// Derived from library.proto
//   https://github.com/googleapis/googleapis/tree/master/google/example/library

// package google.example.library.v1;
import "@typespec/rest";
import "@typespec/openapi";

using Http;

@service(#{ title: "Grpc Library sample" })
namespace GrpcLibrarySample;

@doc("""
  This API represents a simple digital library.  It lets you manage Shelf
  resources and Book resources in the library. It defines the following
  resource model:
  
  - The API has a collection of [Shelf][google.example.library.v1.Shelf]
    resources, named `shelves/*`
  
  - Each Shelf has a collection of [Book][google.example.library.v1.Book]
    resources, named `shelves/*/books/*`
  """)
@route("/v1")
@tag("LibraryService")
namespace LibraryService {
  @doc("Creates a shelf, and returns the new Shelf.")
  @route("shelves")
  @post
  op createShelf(...CreateShelfRequest): Shelf | RpcStatus;

  @doc("Gets a shelf. Returns NOT_FOUND if the shelf does not exist.")
  @route("shelves")
  op getShelf(...GetShelfRequest): Shelf | RpcStatus;

  @doc("""
    Lists shelves. The order is unspecified but deterministic. Newly created
    shelves will not necessarily be added to the end of this list.
    """)
  @route("shelves")
  op listShelves(...ListRequestBase): ListShelvesResponse | RpcStatus;

  @doc("Deletes a shelf. Returns NOT_FOUND if the shelf does not exist.")
  @route("shelves")
  @delete
  op deleteShelf(...DeleteShelfRequest): void | RpcStatus;

  @doc("""
    Merges two shelves by adding all books from the shelf named
    `other_shelf_name` to shelf `name`, and deletes
    `other_shelf_name`. Returns the updated shelf.
    The book ids of the moved books may not be the same as the original books.
    Returns NOT_FOUND if either shelf does not exist.
    This call is a no-op if the specified shelves are the same.
    """)
  @route("shelves/{name}:merge")
  @post
  op mergeShelves(...MergeShelvesRequest): Shelf | RpcStatus;

  @doc("Creates a book, and returns the new Book.")
  @route("shelves/{name}/books")
  @post
  op createBook(...CreateBookRequest): Book | RpcStatus;

  @doc("Gets a book. Returns NOT_FOUND if the book does not exist.")
  @route("shelves/shelf_name/books/{name}")
  op getBook(...GetBookRequest): Book | RpcStatus;

  @doc("""
    Lists books in a shelf. The order is unspecified but deterministic. Newly
    created books will not necessarily be added to the end of this list.
    Returns NOT_FOUND if the shelf does not exist.
    """)
  @route("shelves/{name}/books")
  op listBooks(...ListBooksRequest): ListBooksResponse | RpcStatus;

  @route("shelves/shelf_name/books/{name}")
  @doc("Deletes a book. Returns NOT_FOUND if the book does not exist.")
  @delete
  op deleteBook(...DeleteBookRequest): void | RpcStatus;
}

@doc("""
  The name of a book.
  Book names have the form `shelves/{shelf_id}/books/{book_id}`
  """)
@pattern("shelves/\\w+/books/\\w+")
scalar book_name extends string;

@doc("A single book in the library.")
model Book {
  @doc("""
    The resource name of the book.
    Book names have the form `shelves/{shelf_id}/books/{book_id}`.
    The name is ignored when creating a book.
    """)
  name: book_name;

  @doc("The name of the book author.")
  author?: string;

  @doc("The title of the book.")
  title?: string;

  @doc("Value indicating whether the book has been read.")
  read?: boolean;
}

@doc("""
  The name of a shelf.
  Shelf names have the form `shelves/{shelf_id}`.
  """)
@pattern("shelves/\\w+")
scalar shelf_name extends string;

@doc("A Shelf contains a collection of books with a theme.")
model Shelf {
  @doc("""
    The resource name of the shelf.
    Shelf names have the form `shelves/{shelf_id}`.
    The name is ignored when creating a shelf.
    """)
  name: shelf_name;

  @doc("The theme of the shelf")
  theme?: string;
}

@doc("Request message for LibraryService.CreateShelf.")
model CreateShelfRequest {
  @doc("The shelf to create.")
  @body
  body: Shelf;
}

@doc("Request message for LibraryService.GetShelf.")
model GetShelfRequest {
  @doc("The name of the shelf to retrieve.")
  @path
  name: shelf_name;
}

@doc("Response message for LibraryService.ListShelves.")
model ListShelvesResponse {
  @doc("The list of shelves.")
  shelves: Shelf[];

  ...ListResponseBase;
}

@doc("Request message for LibraryService.DeleteShelf.")
model DeleteShelfRequest {
  @doc("The name of the shelf to delete.")
  @path
  name: shelf_name;
}

@doc("""
  Describes the shelf being removed (other_shelf_name) and updated
  (name) in this merge
  """)
model MergeShelvesRequest {
  @doc("The name of the shelf we're adding books to.")
  @path
  name: shelf_name;

  @doc("The name of the shelf we're removing books from and deleting.")
  @body
  other_shelf_name: shelf_name;
}

@doc("Request message for LibraryService.CreateBook.")
model CreateBookRequest {
  @doc("The name of the shelf in which the book is created.")
  @path
  name: shelf_name;

  @doc("The book to create.")
  @body
  book: Book;
}

@doc("Request message for LibraryService.GetBook.")
model GetBookRequest {
  @doc("The name of the book to retrieve.")
  @path
  name: book_name;
}

@doc("Request message for LibraryService.ListBooks.")
model ListBooksRequest {
  @doc("The name of the shelf whose books we'd like to list.")
  @path
  name: shelf_name;

  ...ListRequestBase;

  // TODO[JC]: This is a specialized comment on `page_size`. How would we handle this?
  // Requested page size. Server may return fewer books than requested.
  // If unspecified, server will pick an appropriate default.
  //int32 page_size = 2;
}

@doc("Response message for LibraryService.ListBooks.")
model ListBooksResponse {
  @doc("The list of books.")
  books: Book[];

  ...ListResponseBase;
}

@doc("Request message for LibraryService.UpdateBook.")
model UpdateBookRequest {
  @doc("The name of the book to update.")
  name: book_name;

  @doc("The book to update with. The name must match or be empty.")
  book: Book;
}

@doc("Request message for LibraryService.DeleteBook.")
model DeleteBookRequest {
  @doc("The name of the book to delete.")
  @path
  name: book_name;
}

@doc("""
  Describes what book to move (name) and what shelf we're moving it
  to (other_shelf_name).
  """)
model MoveBookRequest {
  @doc("The name of the book to move.")
  name: book_name;

  @doc("The name of the destination shelf.")
  other_shelf_name: shelf_name;
}

//
// Additional helper models
//

model ListRequestBase {
  @doc("""
    Requested page size. Server may return fewer shelves than requested.
    If unspecified, server will pick an appropriate default.
    """)
  @query
  page_size?: int32;

  @doc("""
    A token identifying a page of results the server should return.
    Typically, this is the value of
    [ListShelvesResponse.next_page_token][google.example.library.v1.ListShelvesResponse.next_page_token]
    returned from the previous call to `ListShelves` method.
    """)
  @query
  page_token?: string;
}

model ListResponseBase {
  @doc("""
    A token to retrieve next page of results.
    Pass this value in the
    [ListShelvesRequest.page_token][google.example.library.v1.ListShelvesRequest.page_token]
    field in the subsequent call to `ListShelves` method to retrieve the next
    page of results.
    """)
  next_page_token?: string;
}

@doc("No body returned")
model Empty {}

@doc("An unexpected error response.")
@error
model RpcStatus {
  code?: int32;
  message?: string;
  details?: ProtobufAny[];
}

model ProtobufAny {
  typeUrl?: string;
  value?: string; // format:byte
}
