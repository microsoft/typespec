import "@azure-tools/typespec-azure-core";
import "@typespec/rest";
import "./models.tsp";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Versioning;
using TypeSpec.Rest;
using TypeSpec.Http;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

namespace DocumentTranslation;

alias ServiceTraits = SupportsRepeatableRequests &
  SupportsConditionalRequests &
  SupportsClientRequestId;

interface DocumentTranslationOperations {
  #suppress "@azure-tools/typespec-azure-core/byos"
  @summary("Submit a single document translation request to the Document Translation service")
  @doc("Use this API to submit a single translation request to the Document Translation Service.")
  @route("document:translate")
  @post
  documentTranslate is RpcOperation<
    DocumentTranslateBody,
    DocumentTranslateResult,
    ServiceTraits
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  #suppress "@azure-tools/typespec-azure-core/long-running-polling-operation-required"
  @summary("Submit a document translation request to the Document Translation service")
  @doc("""
    Use this API to submit a bulk (batch) translation request to the Document
    Translation service.
    Each request can contain multiple documents and must
    contain a source and destination container for each document.
                
    The
    prefix and suffix filter (if supplied) are used to filter folders. The prefix
    is applied to the subpath after the container name.
                
    Glossaries /
    Translation memory can be included in the request and are applied by the
    service when the document is translated.
                
    If the glossary is
    invalid or unreachable during translation, an error is indicated in the
    document status.
    If a file with the same name already exists at the
    destination, it will be overwritten. The targetUrl for each target language
    must be unique.
    """)
  @finalOperation(DocumentTranslationOperations.getTranslationStatus)
  @pollingOperation(DocumentTranslationOperations.getTranslationStatus)
  @route("/document/batches")
  @post
  startTranslation is Azure.Core.Foundations.Operation<
    StartTranslationBody,
    {
      @doc("Request has been accepted successfully.")
      @statusCode
      code: 202;

      @pollingLocation
      @doc("Link to the translation operation status")
      @header("Operation-Location")
      operationLocation: string;
    }
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Existing name"
  @summary("Returns a list of batch requests submitted and the status for each request")
  @doc("""
    Returns a list of batch requests submitted and the status for each
    request.
    This list only contains batch requests submitted by the user (based on
    the resource).
                
    If the number of requests exceeds our paging limit,
    server-side paging is used. Paginated responses indicate a partial result and
    include a continuation token in the response.
    The absence of a continuation
    token means that no additional pages are available.
                
    top, skip
    and maxpagesize query parameters can be used to specify a number of results to
    return and an offset for the collection.
                
    top indicates the total
    number of records the user wants to be returned across all pages.
    skip
    indicates the number of records to skip from the list of batches based on the
    sorting method specified.  By default, we sort by descending start
    time.
    maxpagesize is the maximum items returned in a page.  If more items are
    requested via top (or top is not specified and there are more items to be
    returned), @nextLink will contain the link to the next page.
               
    
    orderby query parameter can be used to sort the returned list (ex
    \"orderby=createdDateTimeUtc asc\" or \"orderby=createdDateTimeUtc
    desc\").
    The default sorting is descending by createdDateTimeUtc.
    Some query
    parameters can be used to filter the returned list (ex:
    \"status=Succeeded,Cancelled\") will only return succeeded and cancelled
    operations.
    createdDateTimeUtcStart and createdDateTimeUtcEnd can be used
    combined or separately to specify a range of datetime to filter the returned
    list by.
    The supported filtering query parameters are (status, ids,
    createdDateTimeUtcStart, createdDateTimeUtcEnd).
                
    The server honors
    the values specified by the client. However, clients must be prepared to handle
    responses that contain a different page size or contain a continuation token.
     
              
    When both top and skip are included, the server should first apply
    skip and then top on the collection.
    Note: If the server can't honor top
    and/or skip, the server must return an error to the client informing about it
    instead of just ignoring the query options.
    This reduces the risk of the client
    making assumptions about the data returned.
    """)
  @route("/document/batches")
  @get
  getTranslationsStatus is Azure.Core.Foundations.Operation<
    GetTranslationsStatusOptions,
    TranslationsStatus
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  @summary("Returns the status for a specific document")
  @doc("""
    Returns the translation status for a specific document based on the request Id
    and document Id.
    """)
  @route("/document/batches/{id}/documents/{documentId}")
  @get
  getDocumentStatus is Azure.Core.Foundations.Operation<
    {
      @doc("Format - uuid.  The batch id")
      @clientName("translationId")
      @path
      id: uuid;

      @doc("Format - uuid.  The document id")
      @path
      documentId: uuid;
    },
    DocumentStatus
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  @summary("Returns the status for a document translation request")
  @doc("""
    Returns the status for a document translation request.
    The status includes the
    overall request status, as well as the status for documents that are being
    translated as part of that request.
    """)
  @route("/document/batches/{id}")
  @get
  getTranslationStatus is Azure.Core.Foundations.Operation<
    {
      @doc("Format - uuid.  The operation id")
      @clientName("translationId")
      @path
      id: uuid;
    },
    TranslationStatus
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Existing name"
  @summary("Cancel a currently processing or queued translation")
  @doc("""
    Cancel a currently processing or queued translation.
    A translation will not be
    cancelled if it is already completed or failed or cancelling. A bad request
    will be returned.
    All documents that have completed translation will not be
    cancelled and will be charged.
    All pending documents will be cancelled if
    possible.
    """)
  @route("/document/batches/{id}")
  @delete
  cancelTranslation is Azure.Core.Foundations.Operation<
    {
      @doc("Format - uuid.  The operation-id")
      @clientName("translationId")
      @path
      id: uuid;
    },
    TranslationStatus
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Existing name"
  @summary("Returns the status for all documents in a batch document translation request")
  @doc("""
    Returns the status for all documents in a batch document translation request.
     
              
    If the number of documents in the response exceeds our paging limit,
    server-side paging is used.
    Paginated responses indicate a partial result and
    include a continuation token in the response. The absence of a continuation
    token means that no additional pages are available.
                
    top, skip
    and maxpagesize query parameters can be used to specify a number of results to
    return and an offset for the collection.
                
    top indicates the total
    number of records the user wants to be returned across all pages.
    skip
    indicates the number of records to skip from the list of document status held
    by the server based on the sorting method specified.  By default, we sort by
    descending start time.
    maxpagesize is the maximum items returned in a page. 
    If more items are requested via top (or top is not specified and there are
    more items to be returned), @nextLink will contain the link to the next page.
     
              
    orderby query parameter can be used to sort the returned list (ex
    \"orderby=createdDateTimeUtc asc\" or \"orderby=createdDateTimeUtc
    desc\").
    The default sorting is descending by createdDateTimeUtc.
    Some query
    parameters can be used to filter the returned list (ex:
    \"status=Succeeded,Cancelled\") will only return succeeded and cancelled
    documents.
    createdDateTimeUtcStart and createdDateTimeUtcEnd can be used
    combined or separately to specify a range of datetime to filter the returned
    list by.
    The supported filtering query parameters are (status, ids,
    createdDateTimeUtcStart, createdDateTimeUtcEnd).
                
    When both top
    and skip are included, the server should first apply skip and then top on
    the collection.
    Note: If the server can't honor top and/or skip, the server
    must return an error to the client informing about it instead of just ignoring
    the query options.
    This reduces the risk of the client making assumptions about
    the data returned.
    """)
  @route("/document/batches/{id}/documents")
  @get
  getDocumentsStatus is Azure.Core.Foundations.Operation<
    GetDocumentsStatusOptions,
    DocumentsStatus
  >;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Doesn't fit standard ops"
  @summary("Returns a list of supported document formats")
  @doc("""
    The list of supported formats supported by the Document Translation
    service.
    The list includes the common file extension, as well as the
    content-type if using the upload API.
    """)
  @route("/document/formats")
  @get
  getSupportedFormats is Azure.Core.Foundations.Operation<
    {
      @doc("the type of format like document or glossary ")
      @query("type")
      type?: FileFormatType;
    },
    SupportedFileFormats
  >;
}
