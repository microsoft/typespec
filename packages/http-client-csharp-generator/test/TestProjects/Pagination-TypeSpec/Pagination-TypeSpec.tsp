import "@typespec/rest";
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

//
// ** Service description **
//

// TODO: Use `Uri` type when available: https://github.com/microsoft/cadl/issues/654
@versioned(Versions)
@service(
    {
        title: "Pagination Service"
    }
)
@server(
  "{pagnationUri}",
  "Pagination Service",
  {
    pagnationUri: string,
  }
)
@useAuth(OAuth2Auth<[AuthFlow]>)
namespace Pagination;

enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  "2022-05-13"
}

model AuthFlow {
    type: OAuth2FlowType.clientCredentials;
    tokenUrl: "https://pagnation.azure.com/token";
    refreshUrl: "https://pagination.azure.com/refresh";
    scopes: [
        "https://pagination.azure.com/.default"
    ]
}

//
// ** Parameter descriptions **
//

// @doc("A unique identifier for the state of the ledger. If returned as part of a LedgerEntry, it indicates the state from which the entry was read.")
// model TransactionId is string;

// model CollectionIdParameter {
//   @query
//   @doc("The collection id.")
//   collectionId?: string;
// }

//
// ** Model descriptions **
//

// @resource("collections")
// @doc("Identifier for collections.")
// model Collection {
//   @key
//   collectionId: string;
// }

@resource("transactions")
model LedgerEntry {
  @doc("Contents of the ledger entry.")
  contents: string;

  @visibility("read")
  collectionId: string;

  @key
  @visibility("read")
  // @doc("A unique identifier for the state of the ledger. If returned as part of a LedgerEntry, it indicates the state from which the entry was read.")
  transactionId: string;
}

@doc("Paginated ledger entries")
@pagedResult
model PagedLedgerEntries {
  @doc("Array of ledger entries")
  @items
  entries: LedgerEntry[];

  @doc("Path to retrieve next page of ledger entries")
  @nextLink
  customNextLink?: ResourceLocation<LedgerEntry>;
}

@doc("List {name} resources", TResource)
op CustomResourceList<
  TResource extends object,
  TCustom extends Foundations.CustomizationFields = {}
> is Foundations.ResourceList<
  TResource,
  Foundations.CustomParameters<TCustom>,
  Page<TResource>
>;

// // TODO: No way to set "x-ms-enum.name" right now
// @doc("Represents an assignable role.")
// @knownValues(LedgerUserRoleKV)
// model LedgerUserRole is string {};

@doc("User roles")
enum LedgerUserRoleKV {
  Administrator,
  Contributor,
  Reader,
}

// @resource("users")
// @doc("Details about a Confidential ledger user.")
// model LedgerUser {
//   @key
//   @doc("The user id, either an AAD object ID or certificate fingerprint.")
//   @extension("x-ms-skip-url-encoding", true)
//   userId: string;

//   @doc("The user's assigned role.")
//   assignedRole: LedgerUserRole;
// }

// model ReceiptContents {
//   // Elided for now
// }

// // TODO: No way to set "x-ms-enum.name" right now
// @doc("State of a ledger query.")
// @knownValues(LedgerQueryStateKV)
// model LedgerQueryState is string {};

// enum LedgerQueryStateKV {
//   Loading,
//   Ready,
// }

// @doc("A receipt certifying the transaction at the specified id.")
// model TransactionReceipt {
//   receipt: ReceiptContents;
//   state: LedgerQueryState;
//   transactionId: string;
// }

// // TODO: No way to set "x-ms-enum.name" right now
// @doc("Represents the state of the transaction.")
// @knownValues(TransactionStateKV)
// model TransactionState is string {};

// enum TransactionStateKV {
//   Committed,
//   Pending,
// }

// @doc("Response returned to a query for the transaction status.")
// model TransactionStatus {
//   state: TransactionState;
//   transactionId: string;
// }


@doc("Type for input model body")
model ListLedgerEntryInputBody {
  @doc("Required string")
  requiredString: string;

  @doc("Required int")
  requiredInt: int32;
}

@doc("Input model for the ListPaginationLedgerEntries")
model ListLedgerEntryInput {
  @doc("Body parameter")
  @body bodyInput: ListLedgerEntryInputBody;
}

@doc("Text Blocklist.")
@resource("text/blocklists")
model TextBlocklist {
  @doc("Text blocklist name. Only supports the following characters: 0-9  A-Z  a-z  -  .  _  ~")
  @key("blocklistName")
  @visibility("read", "create", "query")
  @maxLength(64)
  blocklistName: string;

  @doc("Text blocklist description.")
  @maxLength(1024)
  description?: string;
}

@doc("Item in TextBlocklist.")
@resource("blockItems")
@parentResource(TextBlocklist)
model TextBlockItem {
  @doc("Block Item Id. It will be uuid.")
  @key("blockItemId")
  @visibility("read", "create", "query")
  @maxLength(64)
  blockItemId: string;

  @doc("Block item description.")
  @maxLength(1024)
  description?: string;

  @doc("Block item content.")
  @maxLength(128)
  text: string;
}

@doc("The interval")
enum Interval {
  @doc("5 seconds, available only if test run duration is less than 10 minutes")
  PT5S,
  @doc("10 seconds, available only if test run duration is less than 10 minutes")
  PT10S,
  @doc("1 minute") PT1M,
  @doc("5 minutes, available only if test run duration is greater than 1 minute")
  PT5M,
  @doc("1 hour, available only if test run duration is greater than 1 minute")
  PT1H,
}

model MetricDimensions {
  @doc("The interval (i.e. timegrain) of the query.")
  @query
  interval?: Interval;

  @doc("Metric name")
  @query
  metricName?: string;

  @doc("Metric namespace to query metric definitions for.")
  @query
  metricNamespace: string;

  @doc("""
  The timespan of the query. It is a string with the following format
  'startDateTime_ISO/endDateTime_ISO'.
  """)
  @query
  timespan?: string;
};

@resource("values")
@parentResource(Dimension)
model DimensionValueListItem {
  @key
  value: string[];
}

@resource("metric-dimensions")
@parentResource(TestRuns)
model Dimension {
  @key
  @doc("Dimension name")
  @path("name")
  @visibility("query")
  name: string;
}

@doc("Load test run model")
@resource("test-runs")
model TestRuns {
  // FIXME: is testRunId optional or required in the response? Resource key and path params cannot be optional
  @key
  @path
  @doc("Unique test run name as identifier")
  @visibility("read")
  testRunId: string;
}

//
// ** Operations **
//

@route("/app")
namespace Pagination {
  @summary("Gets ledger entries from a collection corresponding to a range.")
  @doc("A collection id may optionally be specified. Only entries in the specified (or default) collection will be returned.")
  op ListPaginationLedgerEntries is Azure.Core.Foundations.ResourceList<LedgerEntry, ListLedgerEntryInput, PagedLedgerEntries>;
}

interface AdditionalParameter {  
  @summary("List the dimension values for the given metric dimension name.")
  @doc("List the dimension values for the given metric dimension name.")
  ListMetricDimensionValues is Azure.Core.ResourceList<
    DimensionValueListItem, QueryParametersTrait<MetricDimensions>
  >;
}

@route("/adp")
interface UseFoundationsResourceList {
  @doc("List upload detail for the discovery resource.")
  list is CustomResourceList<LedgerEntry>;  
}

interface TwoTypesItem {
  @summary("Get All Text Blocklists")
  @doc("Get all text blocklists details.")
  listTextBlocklists is Azure.Core.ResourceList<TextBlocklist>;

  @summary("Get All BlockItems By blocklistName")
  @doc("Get all blockItems in a text blocklist")
  listTextBlocklistItems is Azure.Core.ResourceList<
    TextBlockItem,
    ListQueryParametersTrait<StandardListQueryParameters>
  >;
}


@doc("The result of listing the Pools in an Account.")
@pagedResult
model BatchPoolListResult {
    @doc("The list of Pools.")
    @items
    value?: BatchPool[];

    #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
    @doc("The URL to get the next set of results.")
    @nextLink
    `odata.nextLink`?: string;
}

@doc("A Pool in the Azure Batch service.")
model BatchPool {
    @doc("A string that uniquely identifies the Pool within the Account. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within an Account that differ only by case).")
    @visibility("read")
    id?: string;

    @doc("The display name for the Pool. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
    @visibility("read")
    displayName?: string;

    @doc("The URL of the Pool.")
    @visibility("read")
    url?: string;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Model types must use camelCase"
@doc("Client related response header values")
model BatchRequestHeaders {
    @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://docs.microsoft.com/en-us/rest/api/batchservice/odata-filters-in-batch#list-pools.
    """)
    @query
    $filter?: string;

    @doc("An OData $select clause.")
    @query({
        format: "csv",
    })
    $select?: string[];

    @doc("An OData $expand clause.")
    @query({
        format: "csv",
    })
    $expand?: string[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Model types must use camelCase"
@doc("Client related response header values")
model BatchResponseHeaders {
    @doc("The client-request-id provided by the client during the request. This will be returned only if the return-client-request-id parameter was set to true.")
    @header
    `client-request-id`?: string;

    @doc("A unique identifier for the request that was made to the Batch service. If a request is consistently failing and you have verified that the request is properly formulated, you may use this value to report the error to Microsoft. In your report, include the value of this request ID, the approximate time that the request was made, the Batch Account against which the request was made, and the region that Account resides in.")
    @header
    `request-id`?: string;

    @doc("The ETag HTTP response header. This is an opaque string. You can use it to detect whether the resource has changed between requests. In particular, you can pass the ETag to one of the If-Modified-Since, If-Unmodified-Since, If-Match or If-None-Match headers.")
    @header
    @projectedName("python", "etag")
    ETag?: string;

    @doc("The time at which the resource was last modified.")
    @header
    @encode(DateTimeKnownEncoding.rfc7231)
    `Last-Modified`?: utcDateTime;
}

@doc("An error response received from the Azure Batch service.")
@error
model BatchError {
    @doc("An identifier for the error. Codes are invariant and are intended to be consumed programmatically.")
    code: string;
}

interface Pools {
  @doc("Lists all of the Pools in the specified Account.")
  @route("/pools")
  @get
  @convenientAPI(true)
  listPools is RpcOperation<
     BatchRequestHeaders,
     BatchPoolListResult,
     BatchResponseHeaders,
     BatchError
  >;
}
