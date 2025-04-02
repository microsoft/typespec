import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Rest;
using TypeSpec.Http;
using Azure.Core;
using TypeSpec.Versioning;

namespace DocumentTranslation;
@doc("Document Translate Request Content")
model DocumentTranslateContent {
  @doc("Document to be translated in the form")
  document: bytes;

  @doc("Glossary-translation memory will be used during translation in the form. ")
  glossary?: bytes[];
}

@doc("Document Translate Result / Response.")
model DocumentTranslateResult {
  @doc("response content type")
  @header
  contentType: "application/octet-stream";

  @header("x-metered-usage")
  @doc("Specifies consumption (the number of characters for which the user will be charged) for the translation job request")
  @added(Versions.v2024_11_01_preview)
  meteredUsage: int32;

  @header("total-image-scans-succeeded")
  @doc("Specifies the number of successful image translations within a document translation job")
  @added(Versions.v2024_11_01_preview)
  totalImageScansSucceeded: int32;

  @header("total-image-scans-failed")
  @doc("Specifies the number of failed image translations within a document translation job")
  @added(Versions.v2024_11_01_preview)
  totalImageScansFailed: int32;

  @doc("Request response, response is a translated document.")
  @body
  document: bytes;
}

@doc("Format types")
union FileFormatType {
  @doc("Document type file format")
  Document: "document",

  @doc("Glossary type file format")
  Glossary: "glossary",

  string,
}

@doc("Storage Source")
union StorageSource {
  @doc("Azure blob storage source")
  AzureBlob: "AzureBlob",

  string,
}

@doc("List of possible additional output formats")
union AdditionalOutputFileFormat {
  @doc("No additional format")
  None: "None",

  @doc("OpenXmlWord format")
  OpenXmlWord: "OpenXmlWord",

  string,
}

@doc("Storage type of the input documents source string")
union StorageInputType {
  @doc("Folder storage input type")
  Folder: "Folder",

  @doc("File storage input type")
  File: "File",

  string,
}

@doc("Enums containing high level error codes.")
union TranslationErrorCode {
  @doc("InvalidRequest")
  InvalidRequest: "InvalidRequest",

  @doc("InvalidArgument")
  InvalidArgument: "InvalidArgument",

  @doc("InternalServerError")
  InternalServerError: "InternalServerError",

  @doc("ServiceUnavailable")
  ServiceUnavailable: "ServiceUnavailable",

  @doc("ResourceNotFound")
  ResourceNotFound: "ResourceNotFound",

  @doc("Unauthorized")
  Unauthorized: "Unauthorized",

  @doc("RequestRateTooHigh")
  RequestRateTooHigh: "RequestRateTooHigh",

  string,
}

@doc("List of possible statuses for job or document")
union Status {
  @doc("NotStarted")
  NotStarted: "NotStarted",

  @doc("Running")
  Running: "Running",

  @doc("Succeeded")
  Succeeded: "Succeeded",

  @doc("Failed")
  Failed: "Failed",

  @doc("Cancelled")
  Cancelled: "Cancelled",

  @doc("Cancelling")
  Cancelling: "Cancelling",

  @doc("ValidationFailed")
  ValidationFailed: "ValidationFailed",

  string,
}

@doc("Translation job submission batch request")
model StartTranslationDetails {
  @doc("The input list of documents or folders containing documents")
  inputs: BatchRequest[];

  @doc("The batch operation options")
  @added(Versions.v2024_11_01_preview)
  options?: BatchOptions;
}

@doc("Translation batch request options")
@added(Versions.v2024_11_01_preview)
model BatchOptions {
  @doc("Translation text within an image option")
  translateTextWithinImage?: boolean = false;
}

@doc("Definition for the input batch translation request")
model BatchRequest {
  @doc("Source of the input documents")
  source: SourceInput;

  @doc("Location of the destination for the output")
  targets: TargetInput[];

  @doc("Storage type of the input documents source string")
  storageType?: StorageInputType;
}

@doc("Source of the input documents")
model SourceInput {
  @doc("Location of the folder / container or single file with your documents")
  sourceUrl: string;

  @doc("Document filter")
  filter?: DocumentFilter;

  @doc("""
    Language code
    If none is specified, we will perform auto detect on the document
    """)
  language?: string;

  @doc("Storage Source")
  storageSource?: StorageSource;
}

@doc("Document filter")
model DocumentFilter {
  @doc("""
    A case-sensitive prefix string to filter documents in the source path for
    translation. 
    For example, when using a Azure storage blob Uri, use the prefix
    to restrict sub folders for translation.
    """)
  prefix?: string;

  @doc("""
    A case-sensitive suffix string to filter documents in the source path for
    translation. 
    This is most often use for file extensions
    """)
  suffix?: string;
}

@doc("Destination for the finished translated documents")
model TargetInput {
  @doc("Location of the folder / container with your documents")
  targetUrl: string;

  @doc("Category / custom system for translation request")
  category?: string;

  @doc("Target Language")
  language: string;

  @doc("List of Glossary")
  glossaries?: Glossary[];

  @doc("Storage Source")
  storageSource?: StorageSource;
}

@doc("Glossary / translation memory for the request")
model Glossary {
  @doc("""
    Location of the glossary. 
    We will use the file extension to extract the
    formatting if the format parameter is not supplied.
    
    If the translation
    language pair is not present in the glossary, it will not be applied
    """)
  glossaryUrl: string;

  @doc("Format")
  format: string;

  @doc("Optional Version.  If not specified, default is used.")
  version?: string;

  @doc("Storage Source")
  storageSource?: StorageSource;
}

@doc("""
  Contains unified error information used for HTTP responses across any Cognitive
  Service. Instances
  can be created either through
  Microsoft.CloudAI.Containers.HttpStatusExceptionV2 or by returning it directly
  from
  a controller.
  """)
@error
model TranslationErrorResponse {
  @doc("""
    This contains an outer error with error code, message, details, target and an
    inner error with more descriptive details.
    """)
  error?: TranslationError;
}

@doc("""
  This contains an outer error with error code, message, details, target and an
  inner error with more descriptive details.
  """)
model TranslationError {
  @doc("Enums containing high level error codes.")
  code: TranslationErrorCode;

  @doc("Gets high level error message.")
  message: string;

  @doc("""
    Gets the source of the error. 
    For example it would be \"documents\" or
    \"document id\" in case of invalid document.
    """)
  @visibility(Lifecycle.Read)
  target?: string;

  @doc("""
    New Inner Error format which conforms to Cognitive Services API Guidelines
    which is available at
    https://microsoft.sharepoint.com/%3Aw%3A/t/CognitiveServicesPMO/EUoytcrjuJdKpeOKIK_QRC8BPtUYQpKBi8JsWyeDMRsWlQ?e=CPq8ow.
    This
    contains required properties ErrorCode, message and optional properties target,
    details(key value pair), inner error(this can be nested).
    """)
  innerError?: InnerTranslationError;
}

@doc("""
  New Inner Error format which conforms to Cognitive Services API Guidelines
  which is available at
  https://microsoft.sharepoint.com/%3Aw%3A/t/CognitiveServicesPMO/EUoytcrjuJdKpeOKIK_QRC8BPtUYQpKBi8JsWyeDMRsWlQ?e=CPq8ow.
  This
  contains required properties ErrorCode, message and optional properties target,
  details(key value pair), inner error(this can be nested).
  """)
model InnerTranslationError {
  @doc("Gets code error string.")
  code: string;

  @doc("Gets high level error message.")
  message: string;

  @doc("""
    Gets the source of the error. 
    For example it would be \"documents\" or
    \"document id\" in case of invalid document.
    """)
  @visibility(Lifecycle.Read)
  target?: string;

  @doc("""
    New Inner Error format which conforms to Cognitive Services API Guidelines
    which is available at
    https://microsoft.sharepoint.com/%3Aw%3A/t/CognitiveServicesPMO/EUoytcrjuJdKpeOKIK_QRC8BPtUYQpKBi8JsWyeDMRsWlQ?e=CPq8ow.
    This
    contains required properties ErrorCode, message and optional properties target,
    details(key value pair), inner error(this can be nested).
    """)
  innerError?: InnerTranslationError;
}

@doc("Translation job Status Response")
@pagedResult
model TranslationsStatus {
  @doc("The summary status of individual operation")
  @items
  value: TranslationStatus[];

  @doc("Url for the next page.  Null if no more pages available")
  @nextLink
  nextLink?: string;
}

@doc("Translation job status response")
model TranslationStatus {
  @doc("Id of the translation operation.")
  id: string;

  @doc("Operation created date time")
  // FIXME: (utcDateTime) Please double check that this is the correct type for your scenario.
  createdDateTimeUtc: utcDateTime;

  @doc("Date time in which the operation's status has been updated")
  // FIXME: (utcDateTime) Please double check that this is the correct type for your scenario.
  lastActionDateTimeUtc: utcDateTime;

  @doc("List of possible statuses for job or document")
  status: Status;

  @doc("""
    This contains an outer error with error code, message, details, target and an
    inner error with more descriptive details.
    """)
  error?: TranslationError;

  @doc("Status Summary")
  summary: StatusSummary;
}

@doc("Status Summary")
model StatusSummary {
  @doc("Total count")
  total: int32;

  @doc("Failed count")
  failed: int32;

  @doc("Number of Success")
  success: int32;

  @doc("Number of in progress")
  inProgress: int32;

  @doc("Count of not yet started")
  notYetStarted: int32;

  @doc("Number of cancelled")
  cancelled: int32;

  @doc("Total characters charged by the API")
  totalCharacterCharged: int64;

  @doc("Total image scans charged by the API")
  @added(Versions.v2024_11_01_preview)
  totalImageScansSucceeded?: int32;

  @doc("Total image scans failed")
  @added(Versions.v2024_11_01_preview)
  totalImageScansFailed?: int32;
}

@doc("Document Status Response")
model DocumentStatus {
  @doc("Location of the document or folder")
  path?: string;

  @doc("Location of the source document")
  sourcePath: string;

  @doc("Operation created date time")
  // FIXME: (utcDateTime) Please double check that this is the correct type for your scenario.
  createdDateTimeUtc: utcDateTime;

  @doc("Date time in which the operation's status has been updated")
  // FIXME: (utcDateTime) Please double check that this is the correct type for your scenario.
  lastActionDateTimeUtc: utcDateTime;

  @doc("List of possible statuses for job or document")
  status: Status;

  @doc("To language")
  to: string;

  @doc("""
    This contains an outer error with error code, message, details, target and an
    inner error with more descriptive details.
    """)
  error?: TranslationError;

  @doc("Progress of the translation if available")
  @maxValue(1)
  progress: float32;

  @doc("Document Id")
  id: uuid;

  @doc("Character charged by the API")
  characterCharged?: int32;

  @doc("Total image scans charged by the API")
  @added(Versions.v2024_11_01_preview)
  totalImageScansSucceeded?: int32;

  @doc("Total image scans failed")
  @added(Versions.v2024_11_01_preview)
  totalImageScansFailed?: int32;
}

@doc("Documents Status Response")
@pagedResult
model DocumentsStatus {
  @doc("The detail status of individual documents")
  @items
  value: DocumentStatus[];

  @doc("Url for the next page.  Null if no more pages available")
  @nextLink
  nextLink?: string;
}

@doc("List of supported file formats")
model SupportedFileFormats {
  @doc("list of objects")
  value: FileFormat[];
}

@doc("File Format")
model FileFormat {
  @doc("Name of the format")
  format: string;

  @doc("Supported file extension for this format")
  fileExtensions: string[];

  @doc("Supported Content-Types for this format")
  contentTypes: string[];

  @doc("Default version if none is specified")
  defaultVersion?: string;

  @doc("Supported Version")
  versions?: string[];

  @doc("Supported Type for this format")
  type?: FileFormatType;
}

@doc("Document Translate Request Body")
model DocumentTranslateBody {
  @doc("""
    Specifies source language of the input document.
    If this parameter isn't specified, automatic language detection is applied to determine the source language.
    For example if the source document is written in English, then use sourceLanguage=en
    """)
  @query("sourceLanguage")
  sourceLanguage?: string;

  @doc("""
    Specifies the language of the output document.
    The target language must be one of the supported languages included in the translation scope.
    For example if you want to translate the document in German language, then use targetLanguage=de 
    """)
  @query("targetLanguage")
  targetLanguage: string;

  @doc("""
    A string specifying the category (domain) of the translation. This parameter is used to get translations 
    from a customized system built with Custom Translator. Add the Category ID from your Custom Translator 
    project details to this parameter to use your deployed customized system. Default value is: general.
    """)
  @query("category")
  category?: string = "general";

  @doc("""
    Specifies that the service is allowed to fall back to a general system when a custom system doesn't exist. 
    Possible values are: true (default) or false.
    """)
  @query("allowFallback")
  allowFallback?: boolean;

  @doc("Content Type as multipart/form-data")
  @header
  contentType: "multipart/form-data";

  #suppress "deprecated" "Legacy multipart TO MIGRATE NEXT SPRINT"
  @doc("Document Translate Request Content")
  @body
  body: DocumentTranslateContent;

  @doc("Optional boolean parameter to translate text within an image in the document")
  @query("translateTextWithinImage")
  @added(Versions.v2024_11_01_preview)
  translateTextWithinImage?: boolean;
}

@doc("Start Translation Request Body")
model StartTranslationBody {
  @doc("Translation job submission batch request")
  @body
  body: StartTranslationDetails;
}

@doc("Get Translations Status options")
model GetTranslationsStatusOptions {
  @doc("""
    top indicates the total number of records the user wants to be returned across
    all pages.
                
    Clients MAY use top and skip query parameters to
    specify a number of results to return and an offset into the collection.
    When
    both top and skip are given by a client, the server SHOULD first apply skip
    and then top on the collection.
                
    Note: If the server can't honor
    top and/or skip, the server MUST return an error to the client informing
    about it instead of just ignoring the query options.
    """)
  @maxValue(2147483647)
  @query("top")
  top?: int32;

  @doc("""
    skip indicates the number of records to skip from the list of records held by
    the server based on the sorting method specified.  By default, we sort by
    descending start time.
                
    Clients MAY use top and skip query
    parameters to specify a number of results to return and an offset into the
    collection.
    When both top and skip are given by a client, the server SHOULD
    first apply skip and then top on the collection.
                
    Note: If the
    server can't honor top and/or skip, the server MUST return an error to the
    client informing about it instead of just ignoring the query options.
    """)
  @maxValue(2147483647)
  @query("skip")
  skip?: int32;

  @doc("""
    maxpagesize is the maximum items returned in a page.  If more items are
    requested via top (or top is not specified and there are more items to be
    returned), @nextLink will contain the link to the next page.
                
    
    Clients MAY request server-driven paging with a specific page size by
    specifying a maxpagesize preference. The server SHOULD honor this preference
    if the specified page size is smaller than the server's default page size.
    """)
  @maxValue(100)
  @minValue(1)
  @query("maxpagesize")
  maxpagesize?: int32 = 50;

  @doc("Ids to use in filtering")
  @query("ids")
  ids?: uuid[];

  @doc("Statuses to use in filtering")
  @query("statuses")
  statuses?: string[];

  @doc("the start datetime to get items after")
  @query("createdDateTimeUtcStart")
  createdDateTimeUtcStart?: utcDateTime;

  @doc("the end datetime to get items before")
  @query("createdDateTimeUtcEnd")
  createdDateTimeUtcEnd?: utcDateTime;

  @doc("the sorting query for the collection (ex: 'CreatedDateTimeUtc asc','CreatedDateTimeUtc desc')")
  @query("orderby")
  orderby?: string[];
}

@doc("Get Documents Status options")
model GetDocumentsStatusOptions {
  @doc("Format - uuid.  The operation id")
  @path
  id: uuid;

  @doc("""
    top indicates the total number of records the user wants to be returned across
    all pages.
                
    Clients MAY use top and skip query parameters to
    specify a number of results to return and an offset into the collection.
    When
    both top and skip are given by a client, the server SHOULD first apply skip
    and then top on the collection.
                
    Note: If the server can't honor
    top and/or skip, the server MUST return an error to the client informing
    about it instead of just ignoring the query options.
    """)
  @maxValue(2147483647)
  @query("top")
  top?: int32;

  @doc("""
    skip indicates the number of records to skip from the list of records held by
    the server based on the sorting method specified.  By default, we sort by
    descending start time.
                
    Clients MAY use top and skip query
    parameters to specify a number of results to return and an offset into the
    collection.
    When both top and skip are given by a client, the server SHOULD
    first apply skip and then top on the collection.
                
    Note: If the
    server can't honor top and/or skip, the server MUST return an error to the
    client informing about it instead of just ignoring the query options.
    """)
  @maxValue(2147483647)
  @query("skip")
  skip?: int32;

  @doc("""
    maxpagesize is the maximum items returned in a page.  If more items are
    requested via top (or top is not specified and there are more items to be
    returned), @nextLink will contain the link to the next page.
                
    
    Clients MAY request server-driven paging with a specific page size by
    specifying a maxpagesize preference. The server SHOULD honor this preference
    if the specified page size is smaller than the server's default page size.
    """)
  @maxValue(100)
  @minValue(1)
  @query("maxpagesize")
  maxpagesize?: int32 = 50;

  @doc("Ids to use in filtering")
  @query("ids")
  ids?: uuid[];

  @doc("Statuses to use in filtering")
  @query("statuses")
  statuses?: string[];

  @doc("the start datetime to get items after")
  @query("createdDateTimeUtcStart")
  createdDateTimeUtcStart?: utcDateTime;

  @doc("the end datetime to get items before")
  @query("createdDateTimeUtcEnd")
  createdDateTimeUtcEnd?: utcDateTime;

  @doc("the sorting query for the collection (ex: 'CreatedDateTimeUtc asc','CreatedDateTimeUtc desc')")
  @query("orderby")
  orderby?: string[];
}
