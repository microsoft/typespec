import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-azure-core";
import "./models-shared.tsp";

using TypeSpec.Rest;
using TypeSpec.Http;
using TypeSpec.Versioning;
namespace Search;

/**
 * Allows the user to choose whether a semantic call should fail completely, or to
 * return partial results.
 */
union SemanticErrorMode {
  string,

  /**
   * If the semantic processing fails, partial results still return. The definition
   * of partial results depends on what semantic step failed and what was the reason
   * for failure.
   */
  Partial: "partial",

  /**
   * If there is an exception during the semantic processing step, the query will
   * fail and return the appropriate HTTP code depending on the error.
   */
  Fail: "fail",
}

/**
 * This parameter is only valid if the query type is `semantic`. If set, the query
 * returns answers extracted from key passages in the highest ranked documents.
 * The number of answers returned can be configured by appending the pipe
 * character `|` followed by the `count-<number of answers>` option after the
 * answers parameter value, such as `extractive|count-3`. Default count is 1. The
 * confidence threshold can be configured by appending the pipe character `|`
 * followed by the `threshold-<confidence threshold>` option after the answers
 * parameter value, such as `extractive|threshold-0.9`. Default threshold is 0.7.
 * The maximum character length of answers can be configured by appending the pipe
 * character '|' followed by the 'count-<number of maximum character length>',
 * such as 'extractive|maxcharlength-600'.
 */
union QueryAnswerType {
  string,

  /**
   * Do not return answers for the query.
   */
  None: "none",

  /**
   * Extracts answer candidates from the contents of the documents returned in
   * response to a query expressed as a question in natural language.
   */
  Extractive: "extractive",
}

/**
 * This parameter is only valid if the query type is `semantic`. If set, the query
 * returns captions extracted from key passages in the highest ranked documents.
 * When Captions is set to `extractive`, highlighting is enabled by default, and
 * can be configured by appending the pipe character `|` followed by the
 * `highlight-<true/false>` option, such as `extractive|highlight-true`. Defaults
 * to `None`. The maximum character length of captions can be configured by
 * appending the pipe character '|' followed by the 'count-<number of maximum
 * character length>', such as 'extractive|maxcharlength-600'.
 */
union QueryCaptionType {
  string,

  /**
   * Do not return captions for the query.
   */
  None: "none",

  /**
   * Extracts captions from the matching documents that contain passages relevant to
   * the search query.
   */
  Extractive: "extractive",
}

/**
 * This parameter is only valid if the query type is `semantic`. When
 * QueryRewrites is set to `generative`, the query terms are sent to a generate
 * model which will produce 10 (default) rewrites to help increase the recall of
 * the request. The requested count can be configured by appending the pipe
 * character `|` followed by the `count-<number of rewrites>` option, such as
 * `generative|count-3`. Defaults to `None`.
 */
@added(Versions.v2024_11_01_preview)
union QueryRewritesType {
  string,

  /**
   * Do not generate additional query rewrites for this query.
   */
  None: "none",

  /**
   * Generate alternative query terms to increase the recall of a search request.
   */
  Generative: "generative",
}

/**
 * Enables a debugging tool that can be used to further explore your search
 * results. You can enable multiple debug modes simultaneously by separating them
 * with a | character, for example: semantic|queryRewrites.
 */
@added(Versions.v2024_11_01_preview)
union QueryDebugMode {
  string,

  /**
   * No query debugging information will be returned.
   */
  Disabled: "disabled",

  /**
   * Allows the user to further explore their reranked results.
   */
  Semantic: "semantic",

  /**
   * Allows the user to further explore their hybrid and vector query results.
   */
  Vector: "vector",

  /**
   * Allows the user to explore the list of query rewrites generated for their
   * search request.
   */
  QueryRewrites: "queryRewrites",

  /**
   * Turn on all debug options.
   */
  All: "all",
}

/**
 * The language of the query.
 */
@added(Versions.v2024_11_01_preview)
union QueryLanguage {
  string,

  /**
   * Query language not specified.
   */
  None: "none",

  /**
   * Query language value for English (United States).
   */
  EnUs: "en-us",

  /**
   * Query language value for English (Great Britain).
   */
  EnGb: "en-gb",

  /**
   * Query language value for English (India).
   */
  EnIn: "en-in",

  /**
   * Query language value for English (Canada).
   */
  EnCa: "en-ca",

  /**
   * Query language value for English (Australia).
   */
  EnAu: "en-au",

  /**
   * Query language value for French (France).
   */
  FrFr: "fr-fr",

  /**
   * Query language value for French (Canada).
   */
  FrCa: "fr-ca",

  /**
   * Query language value for German (Germany).
   */
  DeDe: "de-de",

  /**
   * Query language value for Spanish (Spain).
   */
  EsEs: "es-es",

  /**
   * Query language value for Spanish (Mexico).
   */
  EsMx: "es-mx",

  /**
   * Query language value for Chinese (China).
   */
  ZhCn: "zh-cn",

  /**
   * Query language value for Chinese (Taiwan).
   */
  ZhTw: "zh-tw",

  /**
   * Query language value for Portuguese (Brazil).
   */
  PtBr: "pt-br",

  /**
   * Query language value for Portuguese (Portugal).
   */
  PtPt: "pt-pt",

  /**
   * Query language value for Italian (Italy).
   */
  ItIt: "it-it",

  /**
   * Query language value for Japanese (Japan).
   */
  JaJp: "ja-jp",

  /**
   * Query language value for Korean (Korea).
   */
  KoKr: "ko-kr",

  /**
   * Query language value for Russian (Russia).
   */
  RuRu: "ru-ru",

  /**
   * Query language value for Czech (Czech Republic).
   */
  CsCz: "cs-cz",

  /**
   * Query language value for Dutch (Belgium).
   */
  NlBe: "nl-be",

  /**
   * Query language value for Dutch (Netherlands).
   */
  NlNl: "nl-nl",

  /**
   * Query language value for Hungarian (Hungary).
   */
  HuHu: "hu-hu",

  /**
   * Query language value for Polish (Poland).
   */
  PlPl: "pl-pl",

  /**
   * Query language value for Swedish (Sweden).
   */
  SvSe: "sv-se",

  /**
   * Query language value for Turkish (Turkey).
   */
  TrTr: "tr-tr",

  /**
   * Query language value for Hindi (India).
   */
  HiIn: "hi-in",

  /**
   * Query language value for Arabic (Saudi Arabia).
   */
  ArSa: "ar-sa",

  /**
   * Query language value for Arabic (Egypt).
   */
  ArEg: "ar-eg",

  /**
   * Query language value for Arabic (Morocco).
   */
  ArMa: "ar-ma",

  /**
   * Query language value for Arabic (Kuwait).
   */
  ArKw: "ar-kw",

  /**
   * Query language value for Arabic (Jordan).
   */
  ArJo: "ar-jo",

  /**
   * Query language value for Danish (Denmark).
   */
  DaDk: "da-dk",

  /**
   * Query language value for Norwegian (Norway).
   */
  NoNo: "no-no",

  /**
   * Query language value for Bulgarian (Bulgaria).
   */
  BgBg: "bg-bg",

  /**
   * Query language value for Croatian (Croatia).
   */
  HrHr: "hr-hr",

  /**
   * Query language value for Croatian (Bosnia and Herzegovina).
   */
  HrBa: "hr-ba",

  /**
   * Query language value for Malay (Malaysia).
   */
  MsMy: "ms-my",

  /**
   * Query language value for Malay (Brunei Darussalam).
   */
  MsBn: "ms-bn",

  /**
   * Query language value for Slovenian (Slovenia).
   */
  SlSl: "sl-sl",

  /**
   * Query language value for Tamil (India).
   */
  TaIn: "ta-in",

  /**
   * Query language value for Vietnamese (Viet Nam).
   */
  ViVn: "vi-vn",

  /**
   * Query language value for Greek (Greece).
   */
  ElGr: "el-gr",

  /**
   * Query language value for Romanian (Romania).
   */
  RoRo: "ro-ro",

  /**
   * Query language value for Icelandic (Iceland).
   */
  IsIs: "is-is",

  /**
   * Query language value for Indonesian (Indonesia).
   */
  IdId: "id-id",

  /**
   * Query language value for Thai (Thailand).
   */
  ThTh: "th-th",

  /**
   * Query language value for Lithuanian (Lithuania).
   */
  LtLt: "lt-lt",

  /**
   * Query language value for Ukrainian (Ukraine).
   */
  UkUa: "uk-ua",

  /**
   * Query language value for Latvian (Latvia).
   */
  LvLv: "lv-lv",

  /**
   * Query language value for Estonian (Estonia).
   */
  EtEe: "et-ee",

  /**
   * Query language value for Catalan.
   */
  CaEs: "ca-es",

  /**
   * Query language value for Finnish (Finland).
   */
  FiFi: "fi-fi",

  /**
   * Query language value for Serbian (Bosnia and Herzegovina).
   */
  SrBa: "sr-ba",

  /**
   * Query language value for Serbian (Montenegro).
   */
  SrMe: "sr-me",

  /**
   * Query language value for Serbian (Serbia).
   */
  SrRs: "sr-rs",

  /**
   * Query language value for Slovak (Slovakia).
   */
  SkSk: "sk-sk",

  /**
   * Query language value for Norwegian (Norway).
   */
  NbNo: "nb-no",

  /**
   * Query language value for Armenian (Armenia).
   */
  HyAm: "hy-am",

  /**
   * Query language value for Bengali (India).
   */
  BnIn: "bn-in",

  /**
   * Query language value for Basque.
   */
  EuEs: "eu-es",

  /**
   * Query language value for Galician.
   */
  GlEs: "gl-es",

  /**
   * Query language value for Gujarati (India).
   */
  GuIn: "gu-in",

  /**
   * Query language value for Hebrew (Israel).
   */
  HeIl: "he-il",

  /**
   * Query language value for Irish (Ireland).
   */
  GaIe: "ga-ie",

  /**
   * Query language value for Kannada (India).
   */
  KnIn: "kn-in",

  /**
   * Query language value for Malayalam (India).
   */
  MlIn: "ml-in",

  /**
   * Query language value for Marathi (India).
   */
  MrIn: "mr-in",

  /**
   * Query language value for Persian (U.A.E.).
   */
  FaAe: "fa-ae",

  /**
   * Query language value for Punjabi (India).
   */
  PaIn: "pa-in",

  /**
   * Query language value for Telugu (India).
   */
  TeIn: "te-in",

  /**
   * Query language value for Urdu (Pakistan).
   */
  UrPk: "ur-pk",
}

/**
 * Improve search recall by spell-correcting individual search query terms.
 */
@added(Versions.v2024_11_01_preview)
union QuerySpellerType {
  string,

  /**
   * Speller not enabled.
   */
  None: "none",

  /**
   * Speller corrects individual query terms using a static lexicon for the language
   * specified by the queryLanguage parameter.
   */
  Lexicon: "lexicon",
}

/**
 * The kind of vector query being performed.
 */
union VectorQueryKind {
  string,

  /**
   * Vector query where a raw vector value is provided.
   */
  Vector: "vector",

  /**
   * Vector query where a text value that needs to be vectorized is provided.
   */
  Text: "text",

  /**
   * Vector query where an url that represents an image value that needs to be
   * vectorized is provided.
   */
  @added(Versions.v2024_11_01_preview)
  ImageUrl: "imageUrl",

  /**
   * Vector query where a base 64 encoded binary of an image that needs to be
   * vectorized is provided.
   */
  @added(Versions.v2024_11_01_preview)
  ImageBinary: "imageBinary",
}

/**
 * The kind of vector query being performed.
 */
@added(Versions.v2024_11_01_preview)
union VectorThresholdKind {
  string,

  /**
   * The results of the vector query will be filtered based on the vector similarity
   * metric. Note this is the canonical definition of similarity metric, not the 'distance'
   * version. The threshold direction (larger or smaller) will be chosen
   * automatically according to the metric used by the field.
   */
  VectorSimilarity: "vectorSimilarity",

  @doc("""
    The results of the vector query will filter based on the '@search.score' value.
    Note this is the @search.score returned as part of the search response. The
    threshold direction will be chosen for higher @search.score.
    """)
  SearchScore: "searchScore",
}

/**
 * Determines whether or not filters are applied before or after the vector search
 * is performed.
 */
union VectorFilterMode {
  string,

  /**
   * The filter will be applied after the candidate set of vector results is
   * returned. Depending on the filter selectivity, this can result in fewer results
   * than requested by the parameter 'k'.
   */
  PostFilter: "postFilter",

  /**
   * The filter will be applied before the search query.
   */
  PreFilter: "preFilter",
}

/**
 * Determines whether the count and facets should includes all documents that
 * matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize'
 * window. The default value is 'countAllResults'.
 */
@added(Versions.v2024_11_01_preview)
union HybridCountAndFacetMode {
  string,

  /**
   * Only include documents that were matched within the 'maxTextRecallSize'
   * retrieval window when computing 'count' and 'facets'.
   */
  CountRetrievableResults: "countRetrievableResults",

  /**
   * Include all documents that were matched by the search query when computing 'count'
   * and 'facets', regardless of whether or not those documents are within
   * the 'maxTextRecallSize' retrieval window.
   */
  CountAllResults: "countAllResults",
}

/**
 * The way the field was used for the semantic enrichment process.
 */
@added(Versions.v2024_11_01_preview)
union SemanticFieldState {
  string,

  /**
   * The field was fully used for semantic enrichment.
   */
  Used: "used",

  /**
   * The field was not used for semantic enrichment.
   */
  Unused: "unused",

  /**
   * The field was partially used for semantic enrichment.
   */
  Partial: "partial",
}

/**
 * Reason that a partial response was returned for a semantic ranking request.
 */
union SemanticErrorReason {
  string,

  /**
   * If `semanticMaxWaitInMilliseconds` was set and the semantic processing duration
   * exceeded that value. Only the base results were returned.
   */
  MaxWaitExceeded: "maxWaitExceeded",

  /**
   * The request was throttled. Only the base results were returned.
   */
  CapacityOverloaded: "capacityOverloaded",

  /**
   * At least one step of the semantic process failed.
   */
  Transient: "transient",
}

/**
 * Type of partial response that was returned for a semantic ranking request.
 */
union SemanticSearchResultsType {
  string,

  /**
   * Results without any semantic enrichment or reranking.
   */
  BaseResults: "baseResults",

  /**
   * Results have been reranked with the reranker model and will include semantic
   * captions. They will not include any answers, answers highlights or caption
   * highlights.
   */
  RerankedResults: "rerankedResults",
}

/**
 * Type of query rewrite that was used for this request.
 */
@added(Versions.v2024_11_01_preview)
union SemanticQueryRewritesResultType {
  string,

  /**
   * Query rewrites were not successfully generated for this request. Only the
   * original query was used to retrieve the results.
   */
  OriginalQueryOnly: "originalQueryOnly",
}

/**
 * Specifies the syntax of the search query. The default is 'simple'. Use 'full'
 * if your query uses the Lucene query syntax and 'semantic' if query syntax is
 * not needed.
 */
union QueryType {
  string,

  /**
   * Uses the simple query syntax for searches. Search text is interpreted using a
   * simple query language that allows for symbols such as +, * and "". Queries are
   * evaluated across all searchable fields by default, unless the searchFields
   * parameter is specified.
   */
  Simple: "simple",

  /**
   * Uses the full Lucene query syntax for searches. Search text is interpreted
   * using the Lucene query language which allows field-specific and weighted
   * searches, as well as other advanced features.
   */
  Full: "full",

  /**
   * Best suited for queries expressed in natural language as opposed to keywords.
   * Improves precision of search results by re-ranking the top search results using
   * a ranking model trained on the Web corpus.
   */
  Semantic: "semantic",
}

/**
 * Specifies whether any or all of the search terms must be matched in order to
 * count the document as a match.
 */
union SearchMode {
  string,

  /**
   * Any of the search terms must be matched in order to count the document as a
   * match.
   */
  Any: "any",

  /**
   * All of the search terms must be matched in order to count the document as a
   * match.
   */
  All: "all",
}

/**
 * A value that specifies whether we want to calculate scoring statistics (such as
 * document frequency) globally for more consistent scoring, or locally, for lower
 * latency. The default is 'local'. Use 'global' to aggregate scoring statistics
 * globally before scoring. Using global scoring statistics can increase latency
 * of search queries.
 */
union ScoringStatistics {
  string,

  /**
   * The scoring statistics will be calculated locally for lower latency.
   */
  Local: "local",

  /**
   * The scoring statistics will be calculated globally for more consistent scoring.
   */
  Global: "global",
}

/**
 * The operation to perform on a document in an indexing batch.
 */
union IndexActionType {
  string,

  /**
   * Inserts the document into the index if it is new and updates it if it exists.
   * All fields are replaced in the update case.
   */
  Upload: "upload",

  /**
   * Merges the specified field values with an existing document. If the document
   * does not exist, the merge will fail. Any field you specify in a merge will
   * replace the existing field in the document. This also applies to collections of
   * primitive and complex types.
   */
  Merge: "merge",

  /**
   * Behaves like merge if a document with the given key already exists in the
   * index. If the document does not exist, it behaves like upload with a new
   * document.
   */
  MergeOrUpload: "mergeOrUpload",

  /**
   * Removes the specified document from the index. Any field you specify in a
   * delete operation other than the key field will be ignored. If you want to
   * remove an individual field from a document, use merge instead and set the field
   * explicitly to null.
   */
  Delete: "delete",
}

/**
 * Specifies the mode for Autocomplete. The default is 'oneTerm'. Use 'twoTerms'
 * to get shingles and 'oneTermWithContext' to use the current context in
 * producing autocomplete terms.
 */
union AutocompleteMode {
  string,

  /**
   * Only one term is suggested. If the query has two terms, only the last term is
   * completed. For example, if the input is 'washington medic', the suggested terms
   * could include 'medicaid', 'medicare', and 'medicine'.
   */
  OneTerm: "oneTerm",

  /**
   * Matching two-term phrases in the index will be suggested. For example, if the
   * input is 'medic', the suggested terms could include 'medicare coverage' and 'medical assistant'.
   */
  TwoTerms: "twoTerms",

  /**
   * Completes the last term in a query with two or more terms, where the last two
   * terms are a phrase that exists in the index. For example, if the input is 'washington medic', the suggested terms could include 'washington medicaid' and 'washington medical'.
   */
  OneTermWithContext: "oneTermWithContext",
}

/**
 * Response containing search results from an index.
 */
model SearchDocumentsResult {
  /**
   * The total count of results found by the search operation, or null if the count
   * was not requested. If present, the count may be greater than the number of
   * results in this response. This can happen if you use the $top or $skip
   * parameters, or if the query can't return all the requested documents in a
   * single response.
   */
  @visibility("read")
  @encodedName("application/json", "@odata.count")
  count?: int64;

  /**
   * A value indicating the percentage of the index that was included in the query,
   * or null if minimumCoverage was not specified in the request.
   */
  @visibility("read")
  @encodedName("application/json", "@search.coverage")
  coverage?: float64;

  /**
   * The facet query results for the search operation, organized as a collection of
   * buckets for each faceted field; null if the query did not include any facet
   * expressions.
   */
  @visibility("read")
  @encodedName("application/json", "@search.facets")
  facets?: Record<FacetResult[]>;

  /**
   * The answers query results for the search operation; null if the answers query
   * parameter was not specified or set to 'none'.
   */
  @visibility("read")
  @encodedName("application/json", "@search.answers")
  answers?: QueryAnswerResult[];

  /**
   * Debug information that applies to the search results as a whole.
   */
  @added(Versions.v2024_11_01_preview)
  @visibility("read")
  @encodedName("application/json", "@search.debugInfo")
  debugInfo?: DebugInfo;

  @doc("""
    Continuation JSON payload returned when the query can't return all the
    requested results in a single response. You can use this JSON along with
    @odata.nextLink to formulate another POST Search request to get the next part
    of the search response.
    """)
  @visibility("read")
  @encodedName("application/json", "@search.nextPageParameters")
  nextPageParameters?: SearchRequest;

  /**
   * The sequence of results returned by the query.
   */
  @visibility("read")
  value: SearchResult[];

  /**
   * Continuation URL returned when the query can't return all the requested results
   * in a single response. You can use this URL to formulate another GET or POST
   * Search request to get the next part of the search response. Make sure to use
   * the same verb (GET or POST) as the request that produced this response.
   */
  @visibility("read")
  @encodedName("application/json", "@odata.nextLink")
  nextLink?: string;

  /**
   * Reason that a partial response was returned for a semantic ranking request.
   */
  @visibility("read")
  @encodedName("application/json", "@search.semanticPartialResponseReason")
  semanticPartialResponseReason?: SemanticErrorReason;

  /**
   * Type of partial response that was returned for a semantic ranking request.
   */
  @visibility("read")
  @encodedName("application/json", "@search.semanticPartialResponseType")
  semanticPartialResponseType?: SemanticSearchResultsType;

  /**
   * Type of query rewrite that was used to retrieve documents.
   */
  @added(Versions.v2024_11_01_preview)
  @visibility("read")
  @encodedName("application/json", "@search.semanticQueryRewritesResultType")
  semanticQueryRewritesResultType?: SemanticQueryRewritesResultType;
}

/**
 * A single bucket of a facet query result. Reports the number of documents with a
 * field value falling within a particular range or having a particular value or
 * interval.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model FacetResult {
  ...Record<unknown>;

  /**
   * The approximate count of documents falling within the bucket described by this
   * facet.
   */
  @visibility("read")
  count?: int64;

  /**
   * The nested facet query results for the search operation, organized as a
   * collection of buckets for each faceted field; null if the query did not contain
   * any nested facets.
   */
  @added(Versions.v2024_11_01_preview)
  @visibility("read")
  @encodedName("application/json", "@search.facets")
  facets?: Record<FacetResult[]>;
}

/**
 * An answer is a text passage extracted from the contents of the most relevant
 * documents that matched the query. Answers are extracted from the top search
 * results. Answer candidates are scored and the top answers are selected.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model QueryAnswerResult {
  ...Record<unknown>;

  /**
   * The score value represents how relevant the answer is to the query relative to
   * other answers returned for the query.
   */
  @visibility("read")
  score?: float64;

  /**
   * The key of the document the answer was extracted from.
   */
  @visibility("read")
  key?: string;

  /**
   * The text passage extracted from the document contents as the answer.
   */
  @visibility("read")
  text?: string;

  /**
   * Same text passage as in the Text property with highlighted text phrases most
   * relevant to the query.
   */
  @visibility("read")
  highlights?: string;
}

/**
 * Contains debugging information that can be used to further explore your search
 * results.
 */
@added(Versions.v2024_11_01_preview)
model DebugInfo {
  /**
   * Contains debugging information specific to query rewrites.
   */
  @visibility("read")
  queryRewrites?: QueryRewritesDebugInfo;
}

/**
 * Contains debugging information specific to query rewrites.
 */
@added(Versions.v2024_11_01_preview)
model QueryRewritesDebugInfo {
  /**
   * List of query rewrites generated for the text query.
   */
  @visibility("read")
  text?: QueryRewritesValuesDebugInfo;

  /**
   * List of query rewrites generated for the vectorizable text queries.
   */
  @visibility("read")
  vectors?: QueryRewritesValuesDebugInfo[];
}

/**
 * Contains debugging information specific to query rewrites.
 */
@added(Versions.v2024_11_01_preview)
model QueryRewritesValuesDebugInfo {
  /**
   * The input text to the generative query rewriting model. There may be cases
   * where the user query and the input to the generative model are not identical.
   */
  @visibility("read")
  inputQuery?: string;

  /**
   * List of query rewrites.
   */
  @visibility("read")
  rewrites?: string[];
}

/**
 * Parameters for filtering, sorting, faceting, paging, and other search query
 * behaviors.
 */
model SearchRequest {
  /**
   * A value that specifies whether to fetch the total count of results. Default is
   * false. Setting this value to true may have a performance impact. Note that the
   * count returned is an approximation.
   */
  count?: boolean;

  /**
   * The list of facet expressions to apply to the search query. Each facet
   * expression contains a field name, optionally followed by a comma-separated list
   * of name:value pairs.
   */
  facets?: string[];

  /**
   * The OData $filter expression to apply to the search query.
   */
  filter?: string;

  /**
   * The comma-separated list of field names to use for hit highlights. Only
   * searchable fields can be used for hit highlighting.
   */
  highlight?: string;

  /**
   * A string tag that is appended to hit highlights. Must be set with
   * highlightPreTag. Default is &lt;/em&gt;.
   */
  highlightPostTag?: string;

  /**
   * A string tag that is prepended to hit highlights. Must be set with
   * highlightPostTag. Default is &lt;em&gt;.
   */
  highlightPreTag?: string;

  /**
   * A number between 0 and 100 indicating the percentage of the index that must be
   * covered by a search query in order for the query to be reported as a success.
   * This parameter can be useful for ensuring search availability even for services
   * with only one replica. The default is 100.
   */
  minimumCoverage?: float64;

  /**
   * The comma-separated list of OData $orderby expressions by which to sort the
   * results. Each expression can be either a field name or a call to either the
   * geo.distance() or the search.score() functions. Each expression can be followed
   * by asc to indicate ascending, or desc to indicate descending. The default is
   * ascending order. Ties will be broken by the match scores of documents. If no
   * $orderby is specified, the default sort order is descending by document match
   * score. There can be at most 32 $orderby clauses.
   */
  orderby?: string;

  /**
   * A value that specifies the syntax of the search query. The default is 'simple'.
   * Use 'full' if your query uses the Lucene query syntax.
   */
  queryType?: QueryType;

  /**
   * A value that specifies whether we want to calculate scoring statistics (such as
   * document frequency) globally for more consistent scoring, or locally, for lower
   * latency. The default is 'local'. Use 'global' to aggregate scoring statistics
   * globally before scoring. Using global scoring statistics can increase latency
   * of search queries.
   */
  scoringStatistics?: ScoringStatistics;

  /**
   * A value to be used to create a sticky session, which can help getting more
   * consistent results. As long as the same sessionId is used, a best-effort
   * attempt will be made to target the same replica set. Be wary that reusing the
   * same sessionID values repeatedly can interfere with the load balancing of the
   * requests across replicas and adversely affect the performance of the search
   * service. The value used as sessionId cannot start with a '_' character.
   */
  sessionId?: string;

  /**
   * The list of parameter values to be used in scoring functions (for example,
   * referencePointParameter) using the format name-values. For example, if the
   * scoring profile defines a function with a parameter called 'mylocation' the
   * parameter string would be "mylocation--122.2,44.8" (without the quotes).
   */
  scoringParameters?: string[];

  /**
   * The name of a scoring profile to evaluate match scores for matching documents
   * in order to sort the results.
   */
  scoringProfile?: string;

  /**
   * Enables a debugging tool that can be used to further explore your reranked
   * results.
   */
  @added(Versions.v2024_11_01_preview)
  debug?: QueryDebugMode;

  /**
   * A full-text search query expression; Use "*" or omit this parameter to match
   * all documents.
   */
  search?: string;

  /**
   * The comma-separated list of field names to which to scope the full-text search.
   * When using fielded search (fieldName:searchExpression) in a full Lucene query,
   * the field names of each fielded search expression take precedence over any
   * field names listed in this parameter.
   */
  searchFields?: string;

  /**
   * A value that specifies whether any or all of the search terms must be matched
   * in order to count the document as a match.
   */
  searchMode?: SearchMode;

  /**
   * A value that specifies the language of the search query.
   */
  @added(Versions.v2024_11_01_preview)
  queryLanguage?: QueryLanguage;

  /**
   * A value that specified the type of the speller to use to spell-correct
   * individual search query terms.
   */
  @added(Versions.v2024_11_01_preview)
  speller?: QuerySpellerType;

  /**
   * The comma-separated list of fields to retrieve. If unspecified, all fields
   * marked as retrievable in the schema are included.
   */
  select?: string;

  /**
   * The number of search results to skip. This value cannot be greater than
   * 100,000. If you need to scan documents in sequence, but cannot use skip due to
   * this limitation, consider using orderby on a totally-ordered key and filter
   * with a range query instead.
   */
  skip?: int32;

  /**
   * The number of search results to retrieve. This can be used in conjunction with
   * $skip to implement client-side paging of search results. If results are
   * truncated due to server-side paging, the response will include a continuation
   * token that can be used to issue another Search request for the next page of
   * results.
   */
  top?: int32;

  /**
   * The name of a semantic configuration that will be used when processing
   * documents for queries of type semantic.
   */
  semanticConfiguration?: string;

  /**
   * Allows the user to choose whether a semantic call should fail completely
   * (default / current behavior), or to return partial results.
   */
  semanticErrorHandling?: SemanticErrorMode;

  /**
   * Allows the user to set an upper bound on the amount of time it takes for
   * semantic enrichment to finish processing before the request fails.
   */
  @minValue(700)
  semanticMaxWaitInMilliseconds?: int32;

  /**
   * Allows setting a separate search query that will be solely used for semantic
   * reranking, semantic captions and semantic answers. Is useful for scenarios
   * where there is a need to use different queries between the base retrieval and
   * ranking phase, and the L2 semantic phase.
   */
  semanticQuery?: string;

  /**
   * A value that specifies whether answers should be returned as part of the search
   * response.
   */
  answers?: QueryAnswerType;

  /**
   * A value that specifies whether captions should be returned as part of the
   * search response.
   */
  captions?: QueryCaptionType;

  /**
   * A value that specifies whether query rewrites should be generated to augment
   * the search query.
   */
  @added(Versions.v2024_11_01_preview)
  queryRewrites?: QueryRewritesType;

  /**
   * The comma-separated list of field names used for semantic ranking.
   */
  @added(Versions.v2024_11_01_preview)
  semanticFields?: string;

  /**
   * The query parameters for vector and hybrid search queries.
   */
  vectorQueries?: VectorQuery[];

  /**
   * Determines whether or not filters are applied before or after the vector search
   * is performed. Default is 'preFilter' for new indexes.
   */
  vectorFilterMode?: VectorFilterMode;

  /**
   * The query parameters to configure hybrid search behaviors.
   */
  @added(Versions.v2024_11_01_preview)
  hybridSearch?: HybridSearch;
}

/**
 * The query parameters for vector and hybrid search queries.
 */
@discriminator("kind")
model VectorQuery {
  /**
   * Number of nearest neighbors to return as top hits.
   */
  k?: int32;

  /**
   * Vector Fields of type Collection(Edm.Single) to be included in the vector
   * searched.
   */
  fields?: string;

  /**
   * When true, triggers an exhaustive k-nearest neighbor search across all vectors
   * within the vector index. Useful for scenarios where exact matches are critical,
   * such as determining ground truth values.
   */
  exhaustive?: boolean;

  /**
   * Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling'
   * parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors'
   * is true. This parameter is only permitted when a
   * compression method is used on the underlying vector field.
   */
  oversampling?: float64;

  /**
   * Relative weight of the vector query when compared to other vector query and/or
   * the text query within the same search request. This value is used when
   * combining the results of multiple ranking lists produced by the different
   * vector queries and/or the results retrieved through the text query. The higher
   * the weight, the higher the documents that matched that query will be in the
   * final ranking. Default is 1.0 and the value needs to be a positive number
   * larger than zero.
   */
  weight?: float32;

  /**
   * The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric.
   */
  @added(Versions.v2024_11_01_preview)
  threshold?: VectorThreshold;

  /**
   * The OData filter expression to apply to this specific vector query. If no
   * filter expression is defined at the vector level, the expression defined in the
   * top level filter parameter is used instead.
   */
  @added(Versions.v2024_11_01_preview)
  filterOverride?: string;

  @doc("Type of query.")
  kind: VectorQueryKind;
}

/**
 * The threshold used for vector queries.
 */
@added(Versions.v2024_11_01_preview)
@discriminator("kind")
model VectorThreshold {
  @doc("Type of threshold.")
  kind: VectorThresholdKind;
}

/**
 * TThe query parameters to configure hybrid search behaviors.
 */
@added(Versions.v2024_11_01_preview)
model HybridSearch {
  /**
   * Determines the maximum number of documents to be retrieved by the text query
   * portion of a hybrid search request. Those documents will be combined with the
   * documents matching the vector queries to produce a single final list of
   * results. Choosing a larger maxTextRecallSize value will allow retrieving and
   * paging through more documents (using the top and skip parameters), at the cost
   * of higher resource utilization and higher latency. The value needs to be
   * between 1 and 10,000. Default is 1000.
   */
  maxTextRecallSize?: int32;

  /**
   * Determines whether the count and facets should includes all documents that
   * matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize' window.
   */
  countAndFacetMode?: HybridCountAndFacetMode;
}

/**
 * Contains a document found by a search query, plus associated metadata.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model SearchResult {
  ...Record<unknown>;

  /**
   * The relevance score of the document compared to other documents returned by the
   * query.
   */
  @visibility("read")
  @encodedName("application/json", "@search.score")
  score: float64;

  /**
   * The relevance score computed by the semantic ranker for the top search results.
   * Search results are sorted by the RerankerScore first and then by the Score.
   * RerankerScore is only returned for queries of type 'semantic'.
   */
  @visibility("read")
  @encodedName("application/json", "@search.rerankerScore")
  rerankerScore?: float64;

  /**
   * Text fragments from the document that indicate the matching search terms,
   * organized by each applicable field; null if hit highlighting was not enabled
   * for the query.
   */
  @visibility("read")
  @encodedName("application/json", "@search.highlights")
  highlights?: Record<string[]>;

  /**
   * Captions are the most representative passages from the document relatively to
   * the search query. They are often used as document summary. Captions are only
   * returned for queries of type 'semantic'.
   */
  @visibility("read")
  @encodedName("application/json", "@search.captions")
  captions?: QueryCaptionResult[];

  /**
   * Contains debugging information that can be used to further explore your search
   * results.
   */
  @added(Versions.v2024_11_01_preview)
  @visibility("read")
  @encodedName("application/json", "@search.documentDebugInfo")
  documentDebugInfo?: DocumentDebugInfo[];
}

/**
 * Captions are the most representative passages from the document relatively to
 * the search query. They are often used as document summary. Captions are only
 * returned for queries of type `semantic`.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model QueryCaptionResult {
  ...Record<unknown>;

  /**
   * A representative text passage extracted from the document most relevant to the
   * search query.
   */
  @visibility("read")
  text?: string;

  /**
   * Same text passage as in the Text property with highlighted phrases most
   * relevant to the query.
   */
  @visibility("read")
  highlights?: string;
}

/**
 * Contains debugging information that can be used to further explore your search
 * results.
 */
@added(Versions.v2024_11_01_preview)
model DocumentDebugInfo {
  /**
   * Contains debugging information specific to semantic ranking requests.
   */
  @visibility("read")
  semantic?: SemanticDebugInfo;

  /**
   * Contains debugging information specific to vector and hybrid search.
   */
  @visibility("read")
  vectors?: VectorsDebugInfo;
}

@doc("Contains debugging information specific to semantic ranking requests.")
@added(Versions.v2024_11_01_preview)
model SemanticDebugInfo {
  /**
   * The title field that was sent to the semantic enrichment process, as well as
   * how it was used
   */
  @visibility("read")
  titleField?: QueryResultDocumentSemanticField;

  /**
   * The content fields that were sent to the semantic enrichment process, as well
   * as how they were used
   */
  @visibility("read")
  contentFields?: QueryResultDocumentSemanticField[];

  /**
   * The keyword fields that were sent to the semantic enrichment process, as well
   * as how they were used
   */
  @visibility("read")
  keywordFields?: QueryResultDocumentSemanticField[];

  /**
   * The raw concatenated strings that were sent to the semantic enrichment process.
   */
  @visibility("read")
  rerankerInput?: QueryResultDocumentRerankerInput;
}

/**
 * Description of fields that were sent to the semantic enrichment process, as
 * well as how they were used
 */
@added(Versions.v2024_11_01_preview)
model QueryResultDocumentSemanticField {
  /**
   * The name of the field that was sent to the semantic enrichment process
   */
  @visibility("read")
  name?: string;

  /**
   * The way the field was used for the semantic enrichment process (fully used,
   * partially used, or unused)
   */
  @visibility("read")
  state?: SemanticFieldState;
}

/**
 * The raw concatenated strings that were sent to the semantic enrichment process.
 */
@added(Versions.v2024_11_01_preview)
model QueryResultDocumentRerankerInput {
  /**
   * The raw string for the title field that was used for semantic enrichment.
   */
  @visibility("read")
  title?: string;

  /**
   * The raw concatenated strings for the content fields that were used for semantic
   * enrichment.
   */
  @visibility("read")
  content?: string;

  /**
   * The raw concatenated strings for the keyword fields that were used for semantic
   * enrichment.
   */
  @visibility("read")
  keywords?: string;
}

@doc("Contains debugging information specific to vector and hybrid search.")
@added(Versions.v2024_11_01_preview)
model VectorsDebugInfo {
  /**
   * The breakdown of subscores of the document prior to the chosen result set
   * fusion/combination method such as RRF.
   */
  @visibility("read")
  subscores?: QueryResultDocumentSubscores;
}

/**
 * The breakdown of subscores between the text and vector query components of the
 * search query for this document. Each vector query is shown as a separate object
 * in the same order they were received.
 */
@added(Versions.v2024_11_01_preview)
model QueryResultDocumentSubscores {
  /**
   * The BM25 or Classic score for the text portion of the query.
   */
  @visibility("read")
  text?: TextResult;

  @doc("The vector similarity and @search.score values for each vector query.")
  @visibility("read")
  vectors?: Record<SingleVectorFieldResult>[];

  /**
   * The BM25 or Classic score for the text portion of the query.
   */
  @visibility("read")
  documentBoost?: float64;
}

/**
 * The BM25 or Classic score for the text portion of the query.
 */
@added(Versions.v2024_11_01_preview)
model TextResult {
  /**
   * The BM25 or Classic score for the text portion of the query.
   */
  @visibility("read")
  searchScore?: float64;
}

@doc("""
  A single vector field result. Both @search.score and vector similarity values
  are returned. Vector similarity is related to @search.score by an equation.
  """)
@added(Versions.v2024_11_01_preview)
model SingleVectorFieldResult {
  @doc("""
    The @search.score value that is calculated from the vector similarity score.
    This is the score that's visible in a pure single-field single-vector query.
    """)
  @visibility("read")
  searchScore?: float64;

  /**
   * The vector similarity score for this document. Note this is the canonical
   * definition of similarity metric, not the 'distance' version. For example,
   * cosine similarity instead of cosine distance.
   */
  @visibility("read")
  vectorSimilarity?: float64;
}

/**
 * Response containing suggestion query results from an index.
 */
model SuggestDocumentsResult {
  /**
   * The sequence of results returned by the query.
   */
  @visibility("read")
  value: SuggestResult[];

  /**
   * A value indicating the percentage of the index that was included in the query,
   * or null if minimumCoverage was not set in the request.
   */
  @visibility("read")
  @encodedName("application/json", "@search.coverage")
  coverage?: float64;
}

/**
 * A result containing a document found by a suggestion query, plus associated
 * metadata.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model SuggestResult {
  ...Record<unknown>;

  /**
   * The text of the suggestion result.
   */
  @visibility("read")
  @encodedName("application/json", "@search.text")
  text: string;
}

/**
 * Parameters for filtering, sorting, fuzzy matching, and other suggestions query
 * behaviors.
 */
model SuggestRequest {
  /**
   * An OData expression that filters the documents considered for suggestions.
   */
  filter?: string;

  /**
   * A value indicating whether to use fuzzy matching for the suggestion query.
   * Default is false. When set to true, the query will find suggestions even if
   * there's a substituted or missing character in the search text. While this
   * provides a better experience in some scenarios, it comes at a performance cost
   * as fuzzy suggestion searches are slower and consume more resources.
   */
  fuzzy?: boolean;

  /**
   * A string tag that is appended to hit highlights. Must be set with
   * highlightPreTag. If omitted, hit highlighting of suggestions is disabled.
   */
  highlightPostTag?: string;

  /**
   * A string tag that is prepended to hit highlights. Must be set with
   * highlightPostTag. If omitted, hit highlighting of suggestions is disabled.
   */
  highlightPreTag?: string;

  /**
   * A number between 0 and 100 indicating the percentage of the index that must be
   * covered by a suggestion query in order for the query to be reported as a
   * success. This parameter can be useful for ensuring search availability even for
   * services with only one replica. The default is 80.
   */
  minimumCoverage?: float64;

  /**
   * The comma-separated list of OData $orderby expressions by which to sort the
   * results. Each expression can be either a field name or a call to either the
   * geo.distance() or the search.score() functions. Each expression can be followed
   * by asc to indicate ascending, or desc to indicate descending. The default is
   * ascending order. Ties will be broken by the match scores of documents. If no
   * $orderby is specified, the default sort order is descending by document match
   * score. There can be at most 32 $orderby clauses.
   */
  orderby?: string;

  /**
   * The search text to use to suggest documents. Must be at least 1 character, and
   * no more than 100 characters.
   */
  search: string;

  /**
   * The comma-separated list of field names to search for the specified search
   * text. Target fields must be included in the specified suggester.
   */
  searchFields?: string;

  /**
   * The comma-separated list of fields to retrieve. If unspecified, only the key
   * field will be included in the results.
   */
  select?: string;

  /**
   * The name of the suggester as specified in the suggesters collection that's part
   * of the index definition.
   */
  suggesterName: string;

  /**
   * The number of suggestions to retrieve. This must be a value between 1 and 100.
   * The default is 5.
   */
  top?: int32;
}

/**
 * Contains a batch of document write actions to send to the index.
 */
model IndexBatch {
  /**
   * The actions in the batch.
   */
  value: IndexAction[];
}

/**
 * Represents an index action that operates on a document.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model IndexAction {
  ...Record<unknown>;

  /**
   * The operation to perform on a document in an indexing batch.
   */
  @encodedName("application/json", "@search.action")
  actionType?: IndexActionType;
}

/**
 * Response containing the status of operations for all documents in the indexing
 * request.
 */
model IndexDocumentsResult {
  #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
  @doc("Response containing the status of operations for all actions in the batch.")
  @statusCode
  _: 200 | 207;

  /**
   * The list of status information for each document in the indexing request.
   */
  @visibility("read")
  value: IndexingResult[];
}

/**
 * Status of an indexing operation for a single document.
 */
model IndexingResult {
  /**
   * The key of a document that was in the indexing request.
   */
  @visibility("read")
  key: string;

  /**
   * The error message explaining why the indexing operation failed for the document
   * identified by the key; null if indexing succeeded.
   */
  @visibility("read")
  errorMessage?: string;

  /**
   * A value indicating whether the indexing operation succeeded for the document
   * identified by the key.
   */
  @visibility("read")
  status: boolean;

  /**
   * The status code of the indexing operation. Possible values include: 200 for a
   * successful update or delete, 201 for successful document creation, 400 for a
   * malformed input document, 404 for document not found, 409 for a version
   * conflict, 422 when the index is temporarily unavailable, or 503 for when the
   * service is too busy.
   */
  @visibility("read")
  statusCode: int32;
}

/**
 * The result of Autocomplete query.
 */
model AutocompleteResult {
  /**
   * A value indicating the percentage of the index that was considered by the
   * autocomplete request, or null if minimumCoverage was not specified in the
   * request.
   */
  @visibility("read")
  @encodedName("application/json", "@search.coverage")
  coverage?: float64;

  /**
   * The list of returned Autocompleted items.
   */
  @visibility("read")
  value: AutocompleteItem[];
}

/**
 * The result of Autocomplete requests.
 */
model AutocompleteItem {
  /**
   * The completed term.
   */
  @visibility("read")
  text: string;

  /**
   * The query along with the completed term.
   */
  @visibility("read")
  queryPlusText: string;
}

/**
 * Parameters for fuzzy matching, and other autocomplete query behaviors.
 */
model AutocompleteRequest {
  /**
   * The search text on which to base autocomplete results.
   */
  search: string;

  /**
   * Specifies the mode for Autocomplete. The default is 'oneTerm'. Use 'twoTerms'
   * to get shingles and 'oneTermWithContext' to use the current context while
   * producing auto-completed terms.
   */
  autocompleteMode?: AutocompleteMode;

  /**
   * An OData expression that filters the documents used to produce completed terms
   * for the Autocomplete result.
   */
  filter?: string;

  /**
   * A value indicating whether to use fuzzy matching for the autocomplete query.
   * Default is false. When set to true, the query will autocomplete terms even if
   * there's a substituted or missing character in the search text. While this
   * provides a better experience in some scenarios, it comes at a performance cost
   * as fuzzy autocomplete queries are slower and consume more resources.
   */
  fuzzy?: boolean;

  /**
   * A string tag that is appended to hit highlights. Must be set with
   * highlightPreTag. If omitted, hit highlighting is disabled.
   */
  highlightPostTag?: string;

  /**
   * A string tag that is prepended to hit highlights. Must be set with
   * highlightPostTag. If omitted, hit highlighting is disabled.
   */
  highlightPreTag?: string;

  /**
   * A number between 0 and 100 indicating the percentage of the index that must be
   * covered by an autocomplete query in order for the query to be reported as a
   * success. This parameter can be useful for ensuring search availability even for
   * services with only one replica. The default is 80.
   */
  minimumCoverage?: float64;

  /**
   * The comma-separated list of field names to consider when querying for
   * auto-completed terms. Target fields must be included in the specified
   * suggester.
   */
  searchFields?: string;

  /**
   * The name of the suggester as specified in the suggesters collection that's part
   * of the index definition.
   */
  suggesterName: string;

  /**
   * The number of auto-completed terms to retrieve. This must be a value between 1
   * and 100. The default is 5.
   */
  top?: int32;
}

/**
 * The query parameters to use for vector search when a raw vector value is
 * provided.
 */
model VectorizedQuery extends VectorQuery {
  /**
   * The vector representation of a search query.
   */
  vector: float32[];

  /**
   * The kind of vector query being performed.
   */
  kind: "vector";
}

/**
 * The query parameters to use for vector search when a text value that needs to
 * be vectorized is provided.
 */
model VectorizableTextQuery extends VectorQuery {
  /**
   * The text to be vectorized to perform a vector search query.
   */
  text: string;

  /**
   * Can be configured to let a generative model rewrite the query before sending it
   * to be vectorized.
   */
  @added(Versions.v2024_11_01_preview)
  queryRewrites?: QueryRewritesType;

  /**
   * The kind of vector query being performed.
   */
  kind: "text";
}

/**
 * The query parameters to use for vector search when an url that represents an
 * image value that needs to be vectorized is provided.
 */
@added(Versions.v2024_11_01_preview)
model VectorizableImageUrlQuery extends VectorQuery {
  /**
   * The URL of an image to be vectorized to perform a vector search query.
   */
  url?: string;

  /**
   * The kind of vector query being performed.
   */
  kind: "imageUrl";
}

/**
 * The query parameters to use for vector search when a base 64 encoded binary of
 * an image that needs to be vectorized is provided.
 */
@added(Versions.v2024_11_01_preview)
model VectorizableImageBinaryQuery extends VectorQuery {
  /**
   * The base 64 encoded binary of an image to be vectorized to perform a vector
   * search query.
   */
  base64Image?: string;

  /**
   * The kind of vector query being performed.
   */
  kind: "imageBinary";
}

/**
 * The results of the vector query will be filtered based on the vector similarity
 * metric. Note this is the canonical definition of similarity metric, not the 'distance'
 * version. The threshold direction (larger or smaller) will be chosen
 * automatically according to the metric used by the field.
 */
@added(Versions.v2024_11_01_preview)
model VectorSimilarityThreshold extends VectorThreshold {
  /**
   * The threshold will filter based on the similarity metric value. Note this is
   * the canonical definition of similarity metric, not the 'distance' version. The
   * threshold direction (larger or smaller) will be chosen automatically according
   * to the metric used by the field.
   */
  value: float64;

  /**
   * The kind of threshold used to filter vector queries
   */
  kind: "vectorSimilarity";
}

@doc("""
  The results of the vector query will filter based on the '@search.score' value.
  Note this is the @search.score returned as part of the search response. The
  threshold direction will be chosen for higher @search.score.
  """)
@added(Versions.v2024_11_01_preview)
model SearchScoreThreshold extends VectorThreshold {
  @doc("""
    The threshold will filter based on the '@search.score' value. Note this is the
    @search.score returned as part of the search response. The threshold direction
    will be chosen for higher @search.score.
    """)
  value: float64;

  /**
   * The kind of threshold used to filter vector queries
   */
  kind: "searchScore";
}
