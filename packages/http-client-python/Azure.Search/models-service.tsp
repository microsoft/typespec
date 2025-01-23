import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-azure-core";
import "./models-shared.tsp";

using TypeSpec.Rest;
using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.Core;

namespace Search;

/**
 * Defines the type of a datasource.
 */
union SearchIndexerDataSourceType {
  string,

  /**
   * Indicates an Azure SQL datasource.
   */
  AzureSql: "azuresql",

  /**
   * Indicates a CosmosDB datasource.
   */
  CosmosDb: "cosmosdb",

  /**
   * Indicates an Azure Blob datasource.
   */
  AzureBlob: "azureblob",

  /**
   * Indicates an Azure Table datasource.
   */
  AzureTable: "azuretable",

  /**
   * Indicates a MySql datasource.
   */
  MySql: "mysql",

  /**
   * Indicates an ADLS Gen2 datasource.
   */
  AdlsGen2: "adlsgen2",

  /**
   * Indicates a Microsoft Fabric OneLake datasource.
   */
  @added(Versions.v2024_11_01_preview)
  OneLake: "onelake",
}

/**
 * Represents the parsing mode for indexing from an Azure blob data source.
 */
union BlobIndexerParsingMode {
  string,

  /**
   * Set to default for normal file processing.
   */
  Default: "default",

  /**
   * Set to text to improve indexing performance on plain text files in blob storage.
   */
  Text: "text",

  /**
   * Set to delimitedText when blobs are plain CSV files.
   */
  DelimitedText: "delimitedText",

  /**
   * Set to json to extract structured content from JSON files.
   */
  Json: "json",

  /**
   * Set to jsonArray to extract individual elements of a JSON array as separate
   * documents.
   */
  JsonArray: "jsonArray",

  /**
   * Set to jsonLines to extract individual JSON entities, separated by a new line,
   * as separate documents.
   */
  JsonLines: "jsonLines",

  /**
   * Set to markdown to extract content from markdown files.
   */
  @added(Versions.v2024_11_01_preview)
  Markdown: "markdown",
}

/**
 * Specifies the submode that will determine whether a markdown file will be
 * parsed into exactly one search document or multiple search documents. Default
 * is `oneToMany`.
 */
@added(Versions.v2024_11_01_preview)
union MarkdownParsingSubmode {
  string,

  /**
   * Indicates that each section of the markdown file (up to a specified depth) will
   * be parsed into individual search documents. This can result in a single
   * markdown file producing multiple search documents. This is the default
   * sub-mode.
   */
  OneToMany: "oneToMany",

  /**
   * Indicates that each markdown file will be parsed into a single search document.
   */
  OneToOne: "oneToOne",
}

/**
 * Specifies the max header depth that will be considered while grouping markdown
 * content. Default is `h6`.
 */
@added(Versions.v2024_11_01_preview)
union MarkdownHeaderDepth {
  string,

  /**
   * Indicates that headers up to a level of h1 will be considered while grouping
   * markdown content.
   */
  h1: "h1",

  /**
   * Indicates that headers up to a level of h2 will be considered while grouping
   * markdown content.
   */
  h2: "h2",

  /**
   * Indicates that headers up to a level of h3 will be considered while grouping
   * markdown content.
   */
  h3: "h3",

  /**
   * Indicates that headers up to a level of h4 will be considered while grouping
   * markdown content.
   */
  h4: "h4",

  /**
   * Indicates that headers up to a level of h5 will be considered while grouping
   * markdown content.
   */
  h5: "h5",

  /**
   * Indicates that headers up to a level of h6 will be considered while grouping
   * markdown content. This is the default.
   */
  h6: "h6",
}

/**
 * Specifies the data to extract from Azure blob storage and tells the indexer
 * which data to extract from image content when "imageAction" is set to a value
 * other than "none".  This applies to embedded image content in a .PDF or other
 * application, or image files such as .jpg and .png, in Azure blobs.
 */
union BlobIndexerDataToExtract {
  string,

  /**
   * Indexes just the standard blob properties and user-specified metadata.
   */
  StorageMetadata: "storageMetadata",

  /**
   * Extracts metadata provided by the Azure blob storage subsystem and the
   * content-type specific metadata (for example, metadata unique to just .png files
   * are indexed).
   */
  AllMetadata: "allMetadata",

  /**
   * Extracts all metadata and textual content from each blob.
   */
  ContentAndMetadata: "contentAndMetadata",
}

/**
 * Determines how to process embedded images and image files in Azure blob
 * storage.  Setting the "imageAction" configuration to any value other than
 * "none" requires that a skillset also be attached to that indexer.
 */
union BlobIndexerImageAction {
  string,

  /**
   * Ignores embedded images or image files in the data set.  This is the default.
   */
  None: "none",

  /**
   * Extracts text from images (for example, the word "STOP" from a traffic stop
   * sign), and embeds it into the content field.  This action requires that
   * "dataToExtract" is set to "contentAndMetadata".  A normalized image refers to
   * additional processing resulting in uniform image output, sized and rotated to
   * promote consistent rendering when you include images in visual search results.
   * This information is generated for each image when you use this option.
   */
  GenerateNormalizedImages: "generateNormalizedImages",

  /**
   * Extracts text from images (for example, the word "STOP" from a traffic stop
   * sign), and embeds it into the content field, but treats PDF files differently
   * in that each page will be rendered as an image and normalized accordingly,
   * instead of extracting embedded images.  Non-PDF file types will be treated the
   * same as if "generateNormalizedImages" was set.
   */
  GenerateNormalizedImagePerPage: "generateNormalizedImagePerPage",
}

/**
 * Determines algorithm for text extraction from PDF files in Azure blob storage.
 */
union BlobIndexerPDFTextRotationAlgorithm {
  string,

  /**
   * Leverages normal text extraction.  This is the default.
   */
  None: "none",

  /**
   * May produce better and more readable text extraction from PDF files that have
   * rotated text within them.  Note that there may be a small performance speed
   * impact when this parameter is used.  This parameter only applies to PDF files,
   * and only to PDFs with embedded text.  If the rotated text appears within an
   * embedded image in the PDF, this parameter does not apply.
   */
  DetectAngles: "detectAngles",
}

/**
 * Specifies the environment in which the indexer should execute.
 */
union IndexerExecutionEnvironment {
  string,

  /**
   * Indicates that the search service can determine where the indexer should
   * execute. This is the default environment when nothing is specified and is the
   * recommended value.
   */
  standard: "standard",

  /**
   * Indicates that the indexer should run with the environment provisioned
   * specifically for the search service. This should only be specified as the
   * execution environment if the indexer needs to access resources securely over
   * shared private link resources.
   */
  private: "private",
}

/**
 * Details the status of an individual indexer execution.
 */
@added(Versions.v2024_11_01_preview)
union IndexerExecutionStatusDetail {
  string,

  /**
   * Indicates that the reset that occurred was for a call to ResetDocs.
   */
  ResetDocs: "resetDocs",
}

/**
 * Represents the mode the indexer is executing in.
 */
@added(Versions.v2024_11_01_preview)
union IndexingMode {
  string,

  /**
   * The indexer is indexing all documents in the datasource.
   */
  IndexingAllDocs: "indexingAllDocs",

  /**
   * The indexer is indexing selective, reset documents in the datasource. The
   * documents being indexed are defined on indexer status.
   */
  IndexingResetDocs: "indexingResetDocs",
}

/**
 * Defines behavior of the index projections in relation to the rest of the
 * indexer.
 */
union IndexProjectionMode {
  string,

  /**
   * The source document will be skipped from writing into the indexer's target
   * index.
   */
  SkipIndexingParentDocuments: "skipIndexingParentDocuments",

  /**
   * The source document will be written into the indexer's target index. This is
   * the default pattern.
   */
  IncludeIndexingParentDocuments: "includeIndexingParentDocuments",
}

/**
 * Defines the data type of a field in a search index.
 */
union SearchFieldDataType {
  string,

  /**
   * Indicates that a field contains a string.
   */
  String: "Edm.String",

  /**
   * Indicates that a field contains a 32-bit signed integer.
   */
  Int32: "Edm.Int32",

  /**
   * Indicates that a field contains a 64-bit signed integer.
   */
  Int64: "Edm.Int64",

  /**
   * Indicates that a field contains an IEEE double-precision floating point number.
   */
  Double: "Edm.Double",

  /**
   * Indicates that a field contains a Boolean value (true or false).
   */
  Boolean: "Edm.Boolean",

  /**
   * Indicates that a field contains a date/time value, including timezone
   * information.
   */
  DateTimeOffset: "Edm.DateTimeOffset",

  /**
   * Indicates that a field contains a geo-location in terms of longitude and
   * latitude.
   */
  GeographyPoint: "Edm.GeographyPoint",

  /**
   * Indicates that a field contains one or more complex objects that in turn have
   * sub-fields of other types.
   */
  Complex: "Edm.ComplexType",

  /**
   * Indicates that a field contains a single-precision floating point number. This
   * is only valid when used with Collection(Edm.Single).
   */
  Single: "Edm.Single",

  /**
   * Indicates that a field contains a half-precision floating point number. This is
   * only valid when used with Collection(Edm.Half).
   */
  Half: "Edm.Half",

  /**
   * Indicates that a field contains a 16-bit signed integer. This is only valid
   * when used with Collection(Edm.Int16).
   */
  Int16: "Edm.Int16",

  /**
   * Indicates that a field contains a 8-bit signed integer. This is only valid when
   * used with Collection(Edm.SByte).
   */
  SByte: "Edm.SByte",

  /**
   * Indicates that a field contains a 8-bit unsigned integer. This is only valid
   * when used with Collection(Edm.Byte).
   */
  Byte: "Edm.Byte",
}

/**
 * Defines the names of all text analyzers supported by the search engine.
 */
union LexicalAnalyzerName {
  string,

  /**
   * Microsoft analyzer for Arabic.
   */
  ArMicrosoft: "ar.microsoft",

  /**
   * Lucene analyzer for Arabic.
   */
  ArLucene: "ar.lucene",

  /**
   * Lucene analyzer for Armenian.
   */
  HyLucene: "hy.lucene",

  /**
   * Microsoft analyzer for Bangla.
   */
  BnMicrosoft: "bn.microsoft",

  /**
   * Lucene analyzer for Basque.
   */
  EuLucene: "eu.lucene",

  /**
   * Microsoft analyzer for Bulgarian.
   */
  BgMicrosoft: "bg.microsoft",

  /**
   * Lucene analyzer for Bulgarian.
   */
  BgLucene: "bg.lucene",

  /**
   * Microsoft analyzer for Catalan.
   */
  CaMicrosoft: "ca.microsoft",

  /**
   * Lucene analyzer for Catalan.
   */
  CaLucene: "ca.lucene",

  /**
   * Microsoft analyzer for Chinese (Simplified).
   */
  ZhHansMicrosoft: "zh-Hans.microsoft",

  /**
   * Lucene analyzer for Chinese (Simplified).
   */
  ZhHansLucene: "zh-Hans.lucene",

  /**
   * Microsoft analyzer for Chinese (Traditional).
   */
  ZhHantMicrosoft: "zh-Hant.microsoft",

  /**
   * Lucene analyzer for Chinese (Traditional).
   */
  ZhHantLucene: "zh-Hant.lucene",

  /**
   * Microsoft analyzer for Croatian.
   */
  HrMicrosoft: "hr.microsoft",

  /**
   * Microsoft analyzer for Czech.
   */
  CsMicrosoft: "cs.microsoft",

  /**
   * Lucene analyzer for Czech.
   */
  CsLucene: "cs.lucene",

  /**
   * Microsoft analyzer for Danish.
   */
  DaMicrosoft: "da.microsoft",

  /**
   * Lucene analyzer for Danish.
   */
  DaLucene: "da.lucene",

  /**
   * Microsoft analyzer for Dutch.
   */
  NlMicrosoft: "nl.microsoft",

  /**
   * Lucene analyzer for Dutch.
   */
  NlLucene: "nl.lucene",

  /**
   * Microsoft analyzer for English.
   */
  EnMicrosoft: "en.microsoft",

  /**
   * Lucene analyzer for English.
   */
  EnLucene: "en.lucene",

  /**
   * Microsoft analyzer for Estonian.
   */
  EtMicrosoft: "et.microsoft",

  /**
   * Microsoft analyzer for Finnish.
   */
  FiMicrosoft: "fi.microsoft",

  /**
   * Lucene analyzer for Finnish.
   */
  FiLucene: "fi.lucene",

  /**
   * Microsoft analyzer for French.
   */
  FrMicrosoft: "fr.microsoft",

  /**
   * Lucene analyzer for French.
   */
  FrLucene: "fr.lucene",

  /**
   * Lucene analyzer for Galician.
   */
  GlLucene: "gl.lucene",

  /**
   * Microsoft analyzer for German.
   */
  DeMicrosoft: "de.microsoft",

  /**
   * Lucene analyzer for German.
   */
  DeLucene: "de.lucene",

  /**
   * Microsoft analyzer for Greek.
   */
  ElMicrosoft: "el.microsoft",

  /**
   * Lucene analyzer for Greek.
   */
  ElLucene: "el.lucene",

  /**
   * Microsoft analyzer for Gujarati.
   */
  GuMicrosoft: "gu.microsoft",

  /**
   * Microsoft analyzer for Hebrew.
   */
  HeMicrosoft: "he.microsoft",

  /**
   * Microsoft analyzer for Hindi.
   */
  HiMicrosoft: "hi.microsoft",

  /**
   * Lucene analyzer for Hindi.
   */
  HiLucene: "hi.lucene",

  /**
   * Microsoft analyzer for Hungarian.
   */
  HuMicrosoft: "hu.microsoft",

  /**
   * Lucene analyzer for Hungarian.
   */
  HuLucene: "hu.lucene",

  /**
   * Microsoft analyzer for Icelandic.
   */
  IsMicrosoft: "is.microsoft",

  /**
   * Microsoft analyzer for Indonesian (Bahasa).
   */
  IdMicrosoft: "id.microsoft",

  /**
   * Lucene analyzer for Indonesian.
   */
  IdLucene: "id.lucene",

  /**
   * Lucene analyzer for Irish.
   */
  GaLucene: "ga.lucene",

  /**
   * Microsoft analyzer for Italian.
   */
  ItMicrosoft: "it.microsoft",

  /**
   * Lucene analyzer for Italian.
   */
  ItLucene: "it.lucene",

  /**
   * Microsoft analyzer for Japanese.
   */
  JaMicrosoft: "ja.microsoft",

  /**
   * Lucene analyzer for Japanese.
   */
  JaLucene: "ja.lucene",

  /**
   * Microsoft analyzer for Kannada.
   */
  KnMicrosoft: "kn.microsoft",

  /**
   * Microsoft analyzer for Korean.
   */
  KoMicrosoft: "ko.microsoft",

  /**
   * Lucene analyzer for Korean.
   */
  KoLucene: "ko.lucene",

  /**
   * Microsoft analyzer for Latvian.
   */
  LvMicrosoft: "lv.microsoft",

  /**
   * Lucene analyzer for Latvian.
   */
  LvLucene: "lv.lucene",

  /**
   * Microsoft analyzer for Lithuanian.
   */
  LtMicrosoft: "lt.microsoft",

  /**
   * Microsoft analyzer for Malayalam.
   */
  MlMicrosoft: "ml.microsoft",

  /**
   * Microsoft analyzer for Malay (Latin).
   */
  MsMicrosoft: "ms.microsoft",

  /**
   * Microsoft analyzer for Marathi.
   */
  MrMicrosoft: "mr.microsoft",

  /**
   * Microsoft analyzer for Norwegian (Bokmål).
   */
  NbMicrosoft: "nb.microsoft",

  /**
   * Lucene analyzer for Norwegian.
   */
  NoLucene: "no.lucene",

  /**
   * Lucene analyzer for Persian.
   */
  FaLucene: "fa.lucene",

  /**
   * Microsoft analyzer for Polish.
   */
  PlMicrosoft: "pl.microsoft",

  /**
   * Lucene analyzer for Polish.
   */
  PlLucene: "pl.lucene",

  /**
   * Microsoft analyzer for Portuguese (Brazil).
   */
  PtBrMicrosoft: "pt-BR.microsoft",

  /**
   * Lucene analyzer for Portuguese (Brazil).
   */
  PtBrLucene: "pt-BR.lucene",

  /**
   * Microsoft analyzer for Portuguese (Portugal).
   */
  PtPtMicrosoft: "pt-PT.microsoft",

  /**
   * Lucene analyzer for Portuguese (Portugal).
   */
  PtPtLucene: "pt-PT.lucene",

  /**
   * Microsoft analyzer for Punjabi.
   */
  PaMicrosoft: "pa.microsoft",

  /**
   * Microsoft analyzer for Romanian.
   */
  RoMicrosoft: "ro.microsoft",

  /**
   * Lucene analyzer for Romanian.
   */
  RoLucene: "ro.lucene",

  /**
   * Microsoft analyzer for Russian.
   */
  RuMicrosoft: "ru.microsoft",

  /**
   * Lucene analyzer for Russian.
   */
  RuLucene: "ru.lucene",

  /**
   * Microsoft analyzer for Serbian (Cyrillic).
   */
  SrCyrillicMicrosoft: "sr-cyrillic.microsoft",

  /**
   * Microsoft analyzer for Serbian (Latin).
   */
  SrLatinMicrosoft: "sr-latin.microsoft",

  /**
   * Microsoft analyzer for Slovak.
   */
  SkMicrosoft: "sk.microsoft",

  /**
   * Microsoft analyzer for Slovenian.
   */
  SlMicrosoft: "sl.microsoft",

  /**
   * Microsoft analyzer for Spanish.
   */
  EsMicrosoft: "es.microsoft",

  /**
   * Lucene analyzer for Spanish.
   */
  EsLucene: "es.lucene",

  /**
   * Microsoft analyzer for Swedish.
   */
  SvMicrosoft: "sv.microsoft",

  /**
   * Lucene analyzer for Swedish.
   */
  SvLucene: "sv.lucene",

  /**
   * Microsoft analyzer for Tamil.
   */
  TaMicrosoft: "ta.microsoft",

  /**
   * Microsoft analyzer for Telugu.
   */
  TeMicrosoft: "te.microsoft",

  /**
   * Microsoft analyzer for Thai.
   */
  ThMicrosoft: "th.microsoft",

  /**
   * Lucene analyzer for Thai.
   */
  ThLucene: "th.lucene",

  /**
   * Microsoft analyzer for Turkish.
   */
  TrMicrosoft: "tr.microsoft",

  /**
   * Lucene analyzer for Turkish.
   */
  TrLucene: "tr.lucene",

  /**
   * Microsoft analyzer for Ukrainian.
   */
  UkMicrosoft: "uk.microsoft",

  /**
   * Microsoft analyzer for Urdu.
   */
  UrMicrosoft: "ur.microsoft",

  /**
   * Microsoft analyzer for Vietnamese.
   */
  ViMicrosoft: "vi.microsoft",

  /**
   * Standard Lucene analyzer.
   */
  StandardLucene: "standard.lucene",

  /**
   * Standard ASCII Folding Lucene analyzer. See
   * https://learn.microsoft.com/rest/api/searchservice/Custom-analyzers-in-Azure-Search#Analyzers
   */
  StandardAsciiFoldingLucene: "standardasciifolding.lucene",

  /**
   * Treats the entire content of a field as a single token. This is useful for data
   * like zip codes, ids, and some product names. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/KeywordAnalyzer.html
   */
  Keyword: "keyword",

  /**
   * Flexibly separates text into terms via a regular expression pattern. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/PatternAnalyzer.html
   */
  Pattern: "pattern",

  /**
   * Divides text at non-letters and converts them to lower case. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/SimpleAnalyzer.html
   */
  Simple: "simple",

  /**
   * Divides text at non-letters; Applies the lowercase and stopword token filters.
   * See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/StopAnalyzer.html
   */
  Stop: "stop",

  /**
   * An analyzer that uses the whitespace tokenizer. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/WhitespaceAnalyzer.html
   */
  Whitespace: "whitespace",
}

/**
 * Defines the names of all text normalizers supported by the search engine.
 */
@added(Versions.v2024_11_01_preview)
union LexicalNormalizerName {
  string,

  /**
   * Converts alphabetic, numeric, and symbolic Unicode characters which are not in
   * the first 127 ASCII characters (the "Basic Latin" Unicode block) into their
   * ASCII equivalents, if such equivalents exist. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/ASCIIFoldingFilter.html
   */
  AsciiFolding: "asciifolding",

  /**
   * Removes elisions. For example, "l'avion" (the plane) will be converted to
   * "avion" (plane). See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/util/ElisionFilter.html
   */
  Elision: "elision",

  /**
   * Normalizes token text to lowercase. See
   * https://lucene.apache.org/core/6_6_1/analyzers-common/org/apache/lucene/analysis/core/LowerCaseFilter.html
   */
  Lowercase: "lowercase",

  /**
   * Standard normalizer, which consists of lowercase and asciifolding. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/reverse/ReverseStringFilter.html
   */
  Standard: "standard",

  /**
   * Normalizes token text to uppercase. See
   * https://lucene.apache.org/core/6_6_1/analyzers-common/org/apache/lucene/analysis/core/UpperCaseFilter.html
   */
  Uppercase: "uppercase",
}

/**
 * The encoding format for interpreting vector field contents.
 */
union VectorEncodingFormat {
  string,

  /**
   * Encoding format representing bits packed into a wider data type.
   */
  PackedBit: "packedBit",
}

/**
 * The algorithm used for indexing and querying.
 */
union VectorSearchAlgorithmKind {
  string,

  /**
   * HNSW (Hierarchical Navigable Small World), a type of approximate nearest
   * neighbors algorithm.
   */
  Hnsw: "hnsw",

  /**
   * Exhaustive KNN algorithm which will perform brute-force search.
   */
  ExhaustiveKnn: "exhaustiveKnn",
}

/**
 * The vectorization method to be used during query time.
 */
union VectorSearchVectorizerKind {
  string,

  /**
   * Generate embeddings using an Azure OpenAI resource at query time.
   */
  AzureOpenAI: "azureOpenAI",

  /**
   * Generate embeddings using a custom web endpoint at query time.
   */
  CustomWebApi: "customWebApi",

  /**
   * Generate embeddings for an image or text input at query time using the Azure AI
   * Services Vision Vectorize API.
   */
  @added(Versions.v2024_11_01_preview)
  AIServicesVision: "aiServicesVision",

  /**
   * Generate embeddings using an Azure Machine Learning endpoint deployed via the
   * Azure AI Studio Model Catalog at query time.
   */
  @added(Versions.v2024_11_01_preview)
  AML: "aml",
}

/**
 * The compression method used for indexing and querying.
 */
union VectorSearchCompressionKind {
  string,

  /**
   * Scalar Quantization, a type of compression method. In scalar quantization, the
   * original vectors values are compressed to a narrower type by discretizing and
   * representing each component of a vector using a reduced set of quantized
   * values, thereby reducing the overall data size.
   */
  ScalarQuantization: "scalarQuantization",

  /**
   * Binary Quantization, a type of compression method. In binary quantization, the
   * original vectors values are compressed to the narrower binary type by discretizing
   * and representing each component of a vector using binary values,
   * thereby reducing the overall data size.
   */
  BinaryQuantization: "binaryQuantization",
}

/**
 * The storage method for the original full-precision vectors used for rescoring
 * and internal index operations.
 */
@added(Versions.v2024_11_01_preview)
union VectorSearchCompressionRescoreStorageMethod {
  string,

  /**
   * This option preserves the original full-precision vectors. Choose this option
   * for maximum flexibility and highest quality of compressed search results. This
   * consumes more storage but allows for rescoring and oversampling.
   */
  PreserveOriginals: "preserveOriginals",

  /**
   * This option discards the original full-precision vectors. Choose this option
   * for maximum storage savings. Since this option does not allow for rescoring and
   * oversampling, it will often cause slight to moderate reductions in quality.
   */
  DiscardOriginals: "discardOriginals",
}

/**
 * Defines the names of all tokenizers supported by the search engine.
 */
union LexicalTokenizerName {
  string,

  /**
   * Grammar-based tokenizer that is suitable for processing most European-language
   * documents. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/standard/ClassicTokenizer.html
   */
  Classic: "classic",

  /**
   * Tokenizes the input from an edge into n-grams of the given size(s). See
   * https://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ngram/EdgeNGramTokenizer.html
   */
  EdgeNGram: "edgeNGram",

  /**
   * Emits the entire input as a single token. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/KeywordTokenizer.html
   */
  Keyword: "keyword_v2",

  /**
   * Divides text at non-letters. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/LetterTokenizer.html
   */
  Letter: "letter",

  /**
   * Divides text at non-letters and converts them to lower case. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/LowerCaseTokenizer.html
   */
  Lowercase: "lowercase",

  /**
   * Divides text using language-specific rules.
   */
  MicrosoftLanguageTokenizer: "microsoft_language_tokenizer",

  /**
   * Divides text using language-specific rules and reduces words to their base
   * forms.
   */
  MicrosoftLanguageStemmingTokenizer: "microsoft_language_stemming_tokenizer",

  /**
   * Tokenizes the input into n-grams of the given size(s). See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ngram/NGramTokenizer.html
   */
  NGram: "nGram",

  /**
   * Tokenizer for path-like hierarchies. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/path/PathHierarchyTokenizer.html
   */
  PathHierarchy: "path_hierarchy_v2",

  /**
   * Tokenizer that uses regex pattern matching to construct distinct tokens. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/pattern/PatternTokenizer.html
   */
  Pattern: "pattern",

  /**
   * Standard Lucene analyzer; Composed of the standard tokenizer, lowercase filter
   * and stop filter. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/standard/StandardTokenizer.html
   */
  Standard: "standard_v2",

  /**
   * Tokenizes urls and emails as one token. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/standard/UAX29URLEmailTokenizer.html
   */
  UaxUrlEmail: "uax_url_email",

  /**
   * Divides text at whitespace. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/WhitespaceTokenizer.html
   */
  Whitespace: "whitespace",
}

/**
 * Defines the names of all token filters supported by the search engine.
 */
union TokenFilterName {
  string,

  /**
   * A token filter that applies the Arabic normalizer to normalize the orthography.
   * See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ar/ArabicNormalizationFilter.html
   */
  ArabicNormalization: "arabic_normalization",

  /**
   * Strips all characters after an apostrophe (including the apostrophe itself).
   * See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/tr/ApostropheFilter.html
   */
  Apostrophe: "apostrophe",

  /**
   * Converts alphabetic, numeric, and symbolic Unicode characters which are not in
   * the first 127 ASCII characters (the "Basic Latin" Unicode block) into their
   * ASCII equivalents, if such equivalents exist. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/ASCIIFoldingFilter.html
   */
  AsciiFolding: "asciifolding",

  /**
   * Forms bigrams of CJK terms that are generated from the standard tokenizer. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/cjk/CJKBigramFilter.html
   */
  CjkBigram: "cjk_bigram",

  /**
   * Normalizes CJK width differences. Folds fullwidth ASCII variants into the
   * equivalent basic Latin, and half-width Katakana variants into the equivalent
   * Kana. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/cjk/CJKWidthFilter.html
   */
  CjkWidth: "cjk_width",

  /**
   * Removes English possessives, and dots from acronyms. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/standard/ClassicFilter.html
   */
  Classic: "classic",

  /**
   * Construct bigrams for frequently occurring terms while indexing. Single terms
   * are still indexed too, with bigrams overlaid. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/commongrams/CommonGramsFilter.html
   */
  CommonGram: "common_grams",

  /**
   * Generates n-grams of the given size(s) starting from the front or the back of
   * an input token. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ngram/EdgeNGramTokenFilter.html
   */
  EdgeNGram: "edgeNGram_v2",

  /**
   * Removes elisions. For example, "l'avion" (the plane) will be converted to
   * "avion" (plane). See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/util/ElisionFilter.html
   */
  Elision: "elision",

  /**
   * Normalizes German characters according to the heuristics of the German2
   * snowball algorithm. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/de/GermanNormalizationFilter.html
   */
  GermanNormalization: "german_normalization",

  /**
   * Normalizes text in Hindi to remove some differences in spelling variations. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/hi/HindiNormalizationFilter.html
   */
  HindiNormalization: "hindi_normalization",

  /**
   * Normalizes the Unicode representation of text in Indian languages. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/in/IndicNormalizationFilter.html
   */
  IndicNormalization: "indic_normalization",

  /**
   * Emits each incoming token twice, once as keyword and once as non-keyword. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/KeywordRepeatFilter.html
   */
  KeywordRepeat: "keyword_repeat",

  /**
   * A high-performance kstem filter for English. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/en/KStemFilter.html
   */
  KStem: "kstem",

  /**
   * Removes words that are too long or too short. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/LengthFilter.html
   */
  Length: "length",

  /**
   * Limits the number of tokens while indexing. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/LimitTokenCountFilter.html
   */
  Limit: "limit",

  /**
   * Normalizes token text to lower case. See
   * https://lucene.apache.org/core/6_6_1/analyzers-common/org/apache/lucene/analysis/core/LowerCaseFilter.html
   */
  Lowercase: "lowercase",

  /**
   * Generates n-grams of the given size(s). See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ngram/NGramTokenFilter.html
   */
  NGram: "nGram_v2",

  /**
   * Applies normalization for Persian. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/fa/PersianNormalizationFilter.html
   */
  PersianNormalization: "persian_normalization",

  /**
   * Create tokens for phonetic matches. See
   * https://lucene.apache.org/core/4_10_3/analyzers-phonetic/org/apache/lucene/analysis/phonetic/package-tree.html
   */
  Phonetic: "phonetic",

  /**
   * Uses the Porter stemming algorithm to transform the token stream. See
   * http://tartarus.org/~martin/PorterStemmer
   */
  PorterStem: "porter_stem",

  /**
   * Reverses the token string. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/reverse/ReverseStringFilter.html
   */
  Reverse: "reverse",

  /**
   * Normalizes use of the interchangeable Scandinavian characters. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/ScandinavianNormalizationFilter.html
   */
  ScandinavianNormalization: "scandinavian_normalization",

  /**
   * Folds Scandinavian characters åÅäæÄÆ-&gt;a and öÖøØ-&gt;o. It also
   * discriminates against use of double vowels aa, ae, ao, oe and oo, leaving just
   * the first one. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/ScandinavianFoldingFilter.html
   */
  ScandinavianFoldingNormalization: "scandinavian_folding",

  /**
   * Creates combinations of tokens as a single token. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/shingle/ShingleFilter.html
   */
  Shingle: "shingle",

  /**
   * A filter that stems words using a Snowball-generated stemmer. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/snowball/SnowballFilter.html
   */
  Snowball: "snowball",

  /**
   * Normalizes the Unicode representation of Sorani text. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/ckb/SoraniNormalizationFilter.html
   */
  SoraniNormalization: "sorani_normalization",

  /**
   * Language specific stemming filter. See
   * https://learn.microsoft.com/rest/api/searchservice/Custom-analyzers-in-Azure-Search#TokenFilters
   */
  Stemmer: "stemmer",

  /**
   * Removes stop words from a token stream. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/core/StopFilter.html
   */
  Stopwords: "stopwords",

  /**
   * Trims leading and trailing whitespace from tokens. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/TrimFilter.html
   */
  Trim: "trim",

  /**
   * Truncates the terms to a specific length. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/TruncateTokenFilter.html
   */
  Truncate: "truncate",

  /**
   * Filters out tokens with same text as the previous token. See
   * http://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/miscellaneous/RemoveDuplicatesTokenFilter.html
   */
  Unique: "unique",

  /**
   * Normalizes token text to upper case. See
   * https://lucene.apache.org/core/6_6_1/analyzers-common/org/apache/lucene/analysis/core/UpperCaseFilter.html
   */
  Uppercase: "uppercase",

  /**
   * Splits words into subwords and performs optional transformations on subword
   * groups.
   */
  WordDelimiter: "word_delimiter",
}

/**
 * Defines the names of all character filters supported by the search engine.
 */
union CharFilterName {
  string,

  /**
   * A character filter that attempts to strip out HTML constructs. See
   * https://lucene.apache.org/core/4_10_3/analyzers-common/org/apache/lucene/analysis/charfilter/HTMLStripCharFilter.html
   */
  HtmlStrip: "html_strip",
}

/**
 * Defines flags that can be combined to control how regular expressions are used
 * in the pattern analyzer and pattern tokenizer.
 */
union RegexFlags {
  string,

  /**
   * Enables canonical equivalence.
   */
  CanonEq: "CANON_EQ",

  /**
   * Enables case-insensitive matching.
   */
  CaseInsensitive: "CASE_INSENSITIVE",

  /**
   * Permits whitespace and comments in the pattern.
   */
  Comments: "COMMENTS",

  /**
   * Enables dotall mode.
   */
  DotAll: "DOTALL",

  /**
   * Enables literal parsing of the pattern.
   */
  Literal: "LITERAL",

  /**
   * Enables multiline mode.
   */
  Multiline: "MULTILINE",

  /**
   * Enables Unicode-aware case folding.
   */
  UnicodeCase: "UNICODE_CASE",

  /**
   * Enables Unix lines mode.
   */
  UnixLines: "UNIX_LINES",
}

/**
 * The similarity metric to use for vector comparisons. It is recommended to
 * choose the same similarity metric as the embedding model was trained on.
 */
union VectorSearchAlgorithmMetric {
  string,

  /**
   * Measures the angle between vectors to quantify their similarity, disregarding
   * magnitude. The smaller the angle, the closer the similarity.
   */
  Cosine: "cosine",

  /**
   * Computes the straight-line distance between vectors in a multi-dimensional
   * space. The smaller the distance, the closer the similarity.
   */
  Euclidean: "euclidean",

  /**
   * Calculates the sum of element-wise products to gauge alignment and magnitude
   * similarity. The larger and more positive, the closer the similarity.
   */
  DotProduct: "dotProduct",

  /**
   * Only applicable to bit-packed binary data types. Determines dissimilarity by
   * counting differing positions in binary vectors. The fewer differences, the
   * closer the similarity.
   */
  Hamming: "hamming",
}

/**
 * The quantized data type of compressed vector values.
 */
union VectorSearchCompressionTarget {
  string,

  /**
   * 8-bit signed integer.
   */
  Int8: "int8",
}

/**
 * The Azure Open AI model name that will be called.
 */
union AzureOpenAIModelName {
  string,

  /**
   * TextEmbeddingAda002 model.
   */
  TextEmbeddingAda002: "text-embedding-ada-002",

  /**
   * TextEmbedding3Large model.
   */
  TextEmbedding3Large: "text-embedding-3-large",

  /**
   * TextEmbedding3Small model.
   */
  TextEmbedding3Small: "text-embedding-3-small",
}

/**
 * The name of the embedding model from the Azure AI Studio Catalog that will be
 * called.
 */
@added(Versions.v2024_11_01_preview)
union AIStudioModelCatalogName {
  string,

  @doc("OpenAI-CLIP-Image-Text-Embeddings-vit-base-patch32")
  OpenAICLIPImageTextEmbeddingsVitBasePatch32: "OpenAI-CLIP-Image-Text-Embeddings-vit-base-patch32",

  @doc("OpenAI-CLIP-Image-Text-Embeddings-ViT-Large-Patch14-336")
  OpenAICLIPImageTextEmbeddingsViTLargePatch14336: "OpenAI-CLIP-Image-Text-Embeddings-ViT-Large-Patch14-336",

  @doc("Facebook-DinoV2-Image-Embeddings-ViT-Base")
  FacebookDinoV2ImageEmbeddingsViTBase: "Facebook-DinoV2-Image-Embeddings-ViT-Base",

  @doc("Facebook-DinoV2-Image-Embeddings-ViT-Giant")
  FacebookDinoV2ImageEmbeddingsViTGiant: "Facebook-DinoV2-Image-Embeddings-ViT-Giant",

  @doc("Cohere-embed-v3-english")
  CohereEmbedV3English: "Cohere-embed-v3-english",

  @doc("Cohere-embed-v3-multilingual")
  CohereEmbedV3Multilingual: "Cohere-embed-v3-multilingual",
}

/**
 * The language codes supported for input text by KeyPhraseExtractionSkill.
 */
union KeyPhraseExtractionSkillLanguage {
  string,

  /**
   * Danish
   */
  da: "da",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * English
   */
  en: "en",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * German
   */
  de: "de",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Norwegian (Bokmaal)
   */
  no: "no",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese (Portugal)
   */
  `pt-PT`: "pt-PT",

  /**
   * Portuguese (Brazil)
   */
  `pt-BR`: "pt-BR",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Swedish
   */
  sv: "sv",
}

/**
 * The language codes supported for input by OcrSkill.
 */
union OcrSkillLanguage {
  string,

  /**
   * Afrikaans
   */
  af: "af",

  /**
   * Albanian
   */
  sq: "sq",

  /**
   * Angika (Devanagiri)
   */
  anp: "anp",

  /**
   * Arabic
   */
  ar: "ar",

  /**
   * Asturian
   */
  ast: "ast",

  /**
   * Awadhi-Hindi (Devanagiri)
   */
  awa: "awa",

  /**
   * Azerbaijani (Latin)
   */
  az: "az",

  /**
   * Bagheli
   */
  bfy: "bfy",

  /**
   * Basque
   */
  eu: "eu",

  /**
   * Belarusian (Cyrillic and Latin)
   */
  be: "be",

  /**
   * Belarusian (Cyrillic)
   */
  `be-cyrl`: "be-cyrl",

  /**
   * Belarusian (Latin)
   */
  `be-latn`: "be-latn",

  /**
   * Bhojpuri-Hindi (Devanagiri)
   */
  bho: "bho",

  /**
   * Bislama
   */
  bi: "bi",

  /**
   * Bodo (Devanagiri)
   */
  brx: "brx",

  /**
   * Bosnian Latin
   */
  bs: "bs",

  /**
   * Brajbha
   */
  bra: "bra",

  /**
   * Breton
   */
  br: "br",

  /**
   * Bulgarian
   */
  bg: "bg",

  /**
   * Bundeli
   */
  bns: "bns",

  /**
   * Buryat (Cyrillic)
   */
  bua: "bua",

  /**
   * Catalan
   */
  ca: "ca",

  /**
   * Cebuano
   */
  ceb: "ceb",

  /**
   * Chamling
   */
  rab: "rab",

  /**
   * Chamorro
   */
  ch: "ch",

  /**
   * Chhattisgarhi (Devanagiri)
   */
  hne: "hne",

  /**
   * Chinese Simplified
   */
  `zh-Hans`: "zh-Hans",

  /**
   * Chinese Traditional
   */
  `zh-Hant`: "zh-Hant",

  /**
   * Cornish
   */
  kw: "kw",

  /**
   * Corsican
   */
  co: "co",

  /**
   * Crimean Tatar (Latin)
   */
  crh: "crh",

  /**
   * Croatian
   */
  hr: "hr",

  /**
   * Czech
   */
  cs: "cs",

  /**
   * Danish
   */
  da: "da",

  /**
   * Dari
   */
  prs: "prs",

  /**
   * Dhimal (Devanagiri)
   */
  dhi: "dhi",

  /**
   * Dogri (Devanagiri)
   */
  doi: "doi",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * English
   */
  en: "en",

  /**
   * Erzya (Cyrillic)
   */
  myv: "myv",

  /**
   * Estonian
   */
  et: "et",

  /**
   * Faroese
   */
  fo: "fo",

  /**
   * Fijian
   */
  fj: "fj",

  /**
   * Filipino
   */
  fil: "fil",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * Frulian
   */
  fur: "fur",

  /**
   * Gagauz (Latin)
   */
  gag: "gag",

  /**
   * Galician
   */
  gl: "gl",

  /**
   * German
   */
  de: "de",

  /**
   * Gilbertese
   */
  gil: "gil",

  /**
   * Gondi (Devanagiri)
   */
  gon: "gon",

  /**
   * Greek
   */
  el: "el",

  /**
   * Greenlandic
   */
  kl: "kl",

  /**
   * Gurung (Devanagiri)
   */
  gvr: "gvr",

  /**
   * Haitian Creole
   */
  ht: "ht",

  /**
   * Halbi (Devanagiri)
   */
  hlb: "hlb",

  /**
   * Hani
   */
  hni: "hni",

  /**
   * Haryanvi
   */
  bgc: "bgc",

  /**
   * Hawaiian
   */
  haw: "haw",

  /**
   * Hindi
   */
  hi: "hi",

  /**
   * Hmong Daw (Latin)
   */
  mww: "mww",

  /**
   * Ho (Devanagiri)
   */
  hoc: "hoc",

  /**
   * Hungarian
   */
  hu: "hu",

  /**
   * Icelandic
   */
  `is`: "is",

  /**
   * Inari Sami
   */
  smn: "smn",

  /**
   * Indonesian
   */
  id: "id",

  /**
   * Interlingua
   */
  ia: "ia",

  /**
   * Inuktitut (Latin)
   */
  iu: "iu",

  /**
   * Irish
   */
  ga: "ga",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Jaunsari (Devanagiri)
   */
  Jns: "Jns",

  /**
   * Javanese
   */
  jv: "jv",

  /**
   * Kabuverdianu
   */
  kea: "kea",

  /**
   * Kachin (Latin)
   */
  kac: "kac",

  /**
   * Kangri (Devanagiri)
   */
  xnr: "xnr",

  /**
   * Karachay-Balkar
   */
  krc: "krc",

  /**
   * Kara-Kalpak (Cyrillic)
   */
  `kaa-cyrl`: "kaa-cyrl",

  /**
   * Kara-Kalpak (Latin)
   */
  kaa: "kaa",

  /**
   * Kashubian
   */
  csb: "csb",

  /**
   * Kazakh (Cyrillic)
   */
  `kk-cyrl`: "kk-cyrl",

  /**
   * Kazakh (Latin)
   */
  `kk-latn`: "kk-latn",

  /**
   * Khaling
   */
  klr: "klr",

  /**
   * Khasi
   */
  kha: "kha",

  /**
   * K'iche'
   */
  quc: "quc",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Korku
   */
  kfq: "kfq",

  /**
   * Koryak
   */
  kpy: "kpy",

  /**
   * Kosraean
   */
  kos: "kos",

  /**
   * Kumyk (Cyrillic)
   */
  kum: "kum",

  /**
   * Kurdish (Arabic)
   */
  `ku-arab`: "ku-arab",

  /**
   * Kurdish (Latin)
   */
  `ku-latn`: "ku-latn",

  /**
   * Kurukh (Devanagiri)
   */
  kru: "kru",

  /**
   * Kyrgyz (Cyrillic)
   */
  ky: "ky",

  /**
   * Lakota
   */
  lkt: "lkt",

  /**
   * Latin
   */
  la: "la",

  /**
   * Lithuanian
   */
  lt: "lt",

  /**
   * Lower Sorbian
   */
  dsb: "dsb",

  /**
   * Lule Sami
   */
  smj: "smj",

  /**
   * Luxembourgish
   */
  lb: "lb",

  /**
   * Mahasu Pahari (Devanagiri)
   */
  bfz: "bfz",

  /**
   * Malay (Latin)
   */
  ms: "ms",

  /**
   * Maltese
   */
  mt: "mt",

  /**
   * Malto (Devanagiri)
   */
  kmj: "kmj",

  /**
   * Manx
   */
  gv: "gv",

  /**
   * Maori
   */
  mi: "mi",

  /**
   * Marathi
   */
  mr: "mr",

  /**
   * Mongolian (Cyrillic)
   */
  mn: "mn",

  /**
   * Montenegrin (Cyrillic)
   */
  `cnr-cyrl`: "cnr-cyrl",

  /**
   * Montenegrin (Latin)
   */
  `cnr-latn`: "cnr-latn",

  /**
   * Neapolitan
   */
  nap: "nap",

  /**
   * Nepali
   */
  ne: "ne",

  /**
   * Niuean
   */
  niu: "niu",

  /**
   * Nogay
   */
  nog: "nog",

  /**
   * Northern Sami (Latin)
   */
  sme: "sme",

  /**
   * Norwegian
   */
  nb: "nb",

  /**
   * Norwegian
   */
  no: "no",

  /**
   * Occitan
   */
  oc: "oc",

  /**
   * Ossetic
   */
  os: "os",

  /**
   * Pashto
   */
  ps: "ps",

  /**
   * Persian
   */
  fa: "fa",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese
   */
  pt: "pt",

  /**
   * Punjabi (Arabic)
   */
  pa: "pa",

  /**
   * Ripuarian
   */
  ksh: "ksh",

  /**
   * Romanian
   */
  ro: "ro",

  /**
   * Romansh
   */
  rm: "rm",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Sadri (Devanagiri)
   */
  sck: "sck",

  /**
   * Samoan (Latin)
   */
  sm: "sm",

  /**
   * Sanskrit (Devanagiri)
   */
  sa: "sa",

  /**
   * Santali (Devanagiri)
   */
  sat: "sat",

  /**
   * Scots
   */
  sco: "sco",

  /**
   * Scottish Gaelic
   */
  gd: "gd",

  /**
   * Serbian (Latin)
   */
  sr: "sr",

  /**
   * Serbian (Cyrillic)
   */
  `sr-Cyrl`: "sr-Cyrl",

  /**
   * Serbian (Latin)
   */
  `sr-Latn`: "sr-Latn",

  /**
   * Sherpa (Devanagiri)
   */
  xsr: "xsr",

  /**
   * Sirmauri (Devanagiri)
   */
  srx: "srx",

  /**
   * Skolt Sami
   */
  sms: "sms",

  /**
   * Slovak
   */
  sk: "sk",

  /**
   * Slovenian
   */
  sl: "sl",

  /**
   * Somali (Arabic)
   */
  so: "so",

  /**
   * Southern Sami
   */
  sma: "sma",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Swahili (Latin)
   */
  sw: "sw",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Tajik (Cyrillic)
   */
  tg: "tg",

  /**
   * Tatar (Latin)
   */
  tt: "tt",

  /**
   * Tetum
   */
  tet: "tet",

  /**
   * Thangmi
   */
  thf: "thf",

  /**
   * Tongan
   */
  to: "to",

  /**
   * Turkish
   */
  tr: "tr",

  /**
   * Turkmen (Latin)
   */
  tk: "tk",

  /**
   * Tuvan
   */
  tyv: "tyv",

  /**
   * Upper Sorbian
   */
  hsb: "hsb",

  /**
   * Urdu
   */
  ur: "ur",

  /**
   * Uyghur (Arabic)
   */
  ug: "ug",

  /**
   * Uzbek (Arabic)
   */
  `uz-arab`: "uz-arab",

  /**
   * Uzbek (Cyrillic)
   */
  `uz-cyrl`: "uz-cyrl",

  /**
   * Uzbek (Latin)
   */
  uz: "uz",

  /**
   * Volapük
   */
  vo: "vo",

  /**
   * Walser
   */
  wae: "wae",

  /**
   * Welsh
   */
  cy: "cy",

  /**
   * Western Frisian
   */
  fy: "fy",

  /**
   * Yucatec Maya
   */
  yua: "yua",

  /**
   * Zhuang
   */
  za: "za",

  /**
   * Zulu
   */
  zu: "zu",

  /**
   * Unknown (All)
   */
  unk: "unk",
}

/**
 * Defines the sequence of characters to use between the lines of text recognized
 * by the OCR skill. The default value is "space".
 */
union OcrLineEnding {
  string,

  /**
   * Lines are separated by a single space character.
   */
  Space: "space",

  /**
   * Lines are separated by a carriage return ('\r') character.
   */
  CarriageReturn: "carriageReturn",

  /**
   * Lines are separated by a single line feed ('\n') character.
   */
  LineFeed: "lineFeed",

  /**
   * Lines are separated by a carriage return and a line feed ('\r\n') character.
   */
  CarriageReturnLineFeed: "carriageReturnLineFeed",
}

/**
 * The language codes supported for input by ImageAnalysisSkill.
 */
union ImageAnalysisSkillLanguage {
  string,

  /**
   * Arabic
   */
  ar: "ar",

  /**
   * Azerbaijani
   */
  az: "az",

  /**
   * Bulgarian
   */
  bg: "bg",

  /**
   * Bosnian Latin
   */
  bs: "bs",

  /**
   * Catalan
   */
  ca: "ca",

  /**
   * Czech
   */
  cs: "cs",

  /**
   * Welsh
   */
  cy: "cy",

  /**
   * Danish
   */
  da: "da",

  /**
   * German
   */
  de: "de",

  /**
   * Greek
   */
  el: "el",

  /**
   * English
   */
  en: "en",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Estonian
   */
  et: "et",

  /**
   * Basque
   */
  eu: "eu",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * Irish
   */
  ga: "ga",

  /**
   * Galician
   */
  gl: "gl",

  /**
   * Hebrew
   */
  he: "he",

  /**
   * Hindi
   */
  hi: "hi",

  /**
   * Croatian
   */
  hr: "hr",

  /**
   * Hungarian
   */
  hu: "hu",

  /**
   * Indonesian
   */
  id: "id",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Kazakh
   */
  kk: "kk",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Lithuanian
   */
  lt: "lt",

  /**
   * Latvian
   */
  lv: "lv",

  /**
   * Macedonian
   */
  mk: "mk",

  /**
   * Malay Malaysia
   */
  ms: "ms",

  /**
   * Norwegian (Bokmal)
   */
  nb: "nb",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Dari
   */
  prs: "prs",

  /**
   * Portuguese-Brazil
   */
  `pt-BR`: "pt-BR",

  /**
   * Portuguese-Portugal
   */
  pt: "pt",

  /**
   * Portuguese-Portugal
   */
  `pt-PT`: "pt-PT",

  /**
   * Romanian
   */
  ro: "ro",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Slovak
   */
  sk: "sk",

  /**
   * Slovenian
   */
  sl: "sl",

  /**
   * Serbian - Cyrillic RS
   */
  `sr-Cyrl`: "sr-Cyrl",

  /**
   * Serbian - Latin RS
   */
  `sr-Latn`: "sr-Latn",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Thai
   */
  th: "th",

  /**
   * Turkish
   */
  tr: "tr",

  /**
   * Ukrainian
   */
  uk: "uk",

  /**
   * Vietnamese
   */
  vi: "vi",

  /**
   * Chinese Simplified
   */
  zh: "zh",

  /**
   * Chinese Simplified
   */
  `zh-Hans`: "zh-Hans",

  /**
   * Chinese Traditional
   */
  `zh-Hant`: "zh-Hant",
}

/**
 * The strings indicating what visual feature types to return.
 */
union VisualFeature {
  string,

  /**
   * Visual features recognized as adult persons.
   */
  Adult: "adult",

  /**
   * Visual features recognized as commercial brands.
   */
  Brands: "brands",

  /**
   * Categories.
   */
  Categories: "categories",

  /**
   * Description.
   */
  Description: "description",

  /**
   * Visual features recognized as people faces.
   */
  Faces: "faces",

  /**
   * Visual features recognized as objects.
   */
  Objects: "objects",

  /**
   * Tags.
   */
  Tags: "tags",
}

/**
 * A string indicating which domain-specific details to return.
 */
union ImageDetail {
  string,

  /**
   * Details recognized as celebrities.
   */
  Celebrities: "celebrities",

  /**
   * Details recognized as landmarks.
   */
  Landmarks: "landmarks",
}

/**
 * A string indicating what entity categories to return.
 */
union EntityCategory {
  string,

  /**
   * Entities describing a physical location.
   */
  Location: "location",

  /**
   * Entities describing an organization.
   */
  Organization: "organization",

  /**
   * Entities describing a person.
   */
  Person: "person",

  /**
   * Entities describing a quantity.
   */
  Quantity: "quantity",

  /**
   * Entities describing a date and time.
   */
  Datetime: "datetime",

  /**
   * Entities describing a URL.
   */
  Url: "url",

  /**
   * Entities describing an email address.
   */
  Email: "email",
}

/**
 * Deprecated. The language codes supported for input text by
 * EntityRecognitionSkill.
 */
union EntityRecognitionSkillLanguage {
  string,

  /**
   * Arabic
   */
  ar: "ar",

  /**
   * Czech
   */
  cs: "cs",

  /**
   * Chinese-Simplified
   */
  `zh-Hans`: "zh-Hans",

  /**
   * Chinese-Traditional
   */
  `zh-Hant`: "zh-Hant",

  /**
   * Danish
   */
  da: "da",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * English
   */
  en: "en",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * German
   */
  de: "de",

  /**
   * Greek
   */
  el: "el",

  /**
   * Hungarian
   */
  hu: "hu",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Norwegian (Bokmaal)
   */
  no: "no",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese (Portugal)
   */
  `pt-PT`: "pt-PT",

  /**
   * Portuguese (Brazil)
   */
  `pt-BR`: "pt-BR",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Turkish
   */
  tr: "tr",
}

/**
 * Deprecated. The language codes supported for input text by SentimentSkill.
 */
union SentimentSkillLanguage {
  string,

  /**
   * Danish
   */
  da: "da",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * English
   */
  en: "en",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * German
   */
  de: "de",

  /**
   * Greek
   */
  el: "el",

  /**
   * Italian
   */
  it: "it",

  /**
   * Norwegian (Bokmaal)
   */
  no: "no",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese (Portugal)
   */
  `pt-PT`: "pt-PT",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Turkish
   */
  tr: "tr",
}

/**
 * A string indicating what maskingMode to use to mask the personal information
 * detected in the input text.
 */
union PIIDetectionSkillMaskingMode {
  string,

  /**
   * No masking occurs and the maskedText output will not be returned.
   */
  None: "none",

  /**
   * Replaces the detected entities with the character given in the maskingCharacter
   * parameter. The character will be repeated to the length of the detected entity
   * so that the offsets will correctly correspond to both the input text as well as
   * the output maskedText.
   */
  Replace: "replace",
}

/**
 * The language codes supported for input text by SplitSkill.
 */
union SplitSkillLanguage {
  string,

  /**
   * Amharic
   */
  am: "am",

  /**
   * Bosnian
   */
  bs: "bs",

  /**
   * Czech
   */
  cs: "cs",

  /**
   * Danish
   */
  da: "da",

  /**
   * German
   */
  de: "de",

  /**
   * English
   */
  en: "en",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Estonian
   */
  et: "et",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * Hebrew
   */
  he: "he",

  /**
   * Hindi
   */
  hi: "hi",

  /**
   * Croatian
   */
  hr: "hr",

  /**
   * Hungarian
   */
  hu: "hu",

  /**
   * Indonesian
   */
  id: "id",

  /**
   * Icelandic
   */
  `is`: "is",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Latvian
   */
  lv: "lv",

  /**
   * Norwegian
   */
  nb: "nb",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese (Portugal)
   */
  pt: "pt",

  /**
   * Portuguese (Brazil)
   */
  `pt-br`: "pt-br",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Slovak
   */
  sk: "sk",

  /**
   * Slovenian
   */
  sl: "sl",

  /**
   * Serbian
   */
  sr: "sr",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Turkish
   */
  tr: "tr",

  /**
   * Urdu
   */
  ur: "ur",

  /**
   * Chinese (Simplified)
   */
  zh: "zh",
}

/**
 * A value indicating which split mode to perform.
 */
union TextSplitMode {
  string,

  /**
   * Split the text into individual pages.
   */
  Pages: "pages",

  /**
   * Split the text into individual sentences.
   */
  Sentences: "sentences",
}

/**
 * A value indicating which unit to use.
 */
@added(Versions.v2024_11_01_preview)
union SplitSkillUnit {
  string,

  /**
   * The length will be measured by character.
   */
  Characters: "characters",

  /**
   * The length will be measured by an AzureOpenAI tokenizer from the tiktoken
   * library.
   */
  AzureOpenAITokens: "azureOpenAITokens",
}

/**
 * A value indicating which tokenizer to use.
 */
@added(Versions.v2024_11_01_preview)
union SplitSkillEncoderModelName {
  string,

  /**
   * Refers to a base model trained with a 50,000 token vocabulary, often used in
   * general natural language processing tasks.
   */
  R50kBase: "r50k_base",

  /**
   * A base model with a 50,000 token vocabulary, optimized for prompt-based tasks.
   */
  P50kBase: "p50k_base",

  /**
   * Similar to p50k_base but fine-tuned for editing or rephrasing tasks with a
   * 50,000 token vocabulary.
   */
  P50kEdit: "p50k_edit",

  /**
   * A base model with a 100,000 token vocabulary.
   */
  CL100kBase: "cl100k_base",
}

/**
 * The language codes supported for input text by CustomEntityLookupSkill.
 */
union CustomEntityLookupSkillLanguage {
  string,

  /**
   * Danish
   */
  da: "da",

  /**
   * German
   */
  de: "de",

  /**
   * English
   */
  en: "en",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * Italian
   */
  it: "it",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Portuguese
   */
  pt: "pt",
}

/**
 * The language codes supported for input text by TextTranslationSkill.
 */
union TextTranslationSkillLanguage {
  string,

  /**
   * Afrikaans
   */
  af: "af",

  /**
   * Arabic
   */
  ar: "ar",

  /**
   * Bangla
   */
  bn: "bn",

  /**
   * Bosnian (Latin)
   */
  bs: "bs",

  /**
   * Bulgarian
   */
  bg: "bg",

  /**
   * Cantonese (Traditional)
   */
  yue: "yue",

  /**
   * Catalan
   */
  ca: "ca",

  /**
   * Chinese Simplified
   */
  `zh-Hans`: "zh-Hans",

  /**
   * Chinese Traditional
   */
  `zh-Hant`: "zh-Hant",

  /**
   * Croatian
   */
  hr: "hr",

  /**
   * Czech
   */
  cs: "cs",

  /**
   * Danish
   */
  da: "da",

  /**
   * Dutch
   */
  nl: "nl",

  /**
   * English
   */
  en: "en",

  /**
   * Estonian
   */
  et: "et",

  /**
   * Fijian
   */
  fj: "fj",

  /**
   * Filipino
   */
  fil: "fil",

  /**
   * Finnish
   */
  fi: "fi",

  /**
   * French
   */
  fr: "fr",

  /**
   * German
   */
  de: "de",

  /**
   * Greek
   */
  el: "el",

  /**
   * Haitian Creole
   */
  ht: "ht",

  /**
   * Hebrew
   */
  he: "he",

  /**
   * Hindi
   */
  hi: "hi",

  /**
   * Hmong Daw
   */
  mww: "mww",

  /**
   * Hungarian
   */
  hu: "hu",

  /**
   * Icelandic
   */
  `is`: "is",

  /**
   * Indonesian
   */
  id: "id",

  /**
   * Italian
   */
  it: "it",

  /**
   * Japanese
   */
  ja: "ja",

  /**
   * Kiswahili
   */
  sw: "sw",

  /**
   * Klingon
   */
  tlh: "tlh",

  /**
   * Klingon (Latin script)
   */
  `tlh-Latn`: "tlh-Latn",

  /**
   * Klingon (Klingon script)
   */
  `tlh-Piqd`: "tlh-Piqd",

  /**
   * Korean
   */
  ko: "ko",

  /**
   * Latvian
   */
  lv: "lv",

  /**
   * Lithuanian
   */
  lt: "lt",

  /**
   * Malagasy
   */
  mg: "mg",

  /**
   * Malay
   */
  ms: "ms",

  /**
   * Maltese
   */
  mt: "mt",

  /**
   * Norwegian
   */
  nb: "nb",

  /**
   * Persian
   */
  fa: "fa",

  /**
   * Polish
   */
  pl: "pl",

  /**
   * Portuguese
   */
  pt: "pt",

  /**
   * Portuguese (Brazil)
   */
  `pt-br`: "pt-br",

  /**
   * Portuguese (Portugal)
   */
  `pt-PT`: "pt-PT",

  /**
   * Queretaro Otomi
   */
  otq: "otq",

  /**
   * Romanian
   */
  ro: "ro",

  /**
   * Russian
   */
  ru: "ru",

  /**
   * Samoan
   */
  sm: "sm",

  /**
   * Serbian (Cyrillic)
   */
  `sr-Cyrl`: "sr-Cyrl",

  /**
   * Serbian (Latin)
   */
  `sr-Latn`: "sr-Latn",

  /**
   * Slovak
   */
  sk: "sk",

  /**
   * Slovenian
   */
  sl: "sl",

  /**
   * Spanish
   */
  es: "es",

  /**
   * Swedish
   */
  sv: "sv",

  /**
   * Tahitian
   */
  ty: "ty",

  /**
   * Tamil
   */
  ta: "ta",

  /**
   * Telugu
   */
  te: "te",

  /**
   * Thai
   */
  th: "th",

  /**
   * Tongan
   */
  to: "to",

  /**
   * Turkish
   */
  tr: "tr",

  /**
   * Ukrainian
   */
  uk: "uk",

  /**
   * Urdu
   */
  ur: "ur",

  /**
   * Vietnamese
   */
  vi: "vi",

  /**
   * Welsh
   */
  cy: "cy",

  /**
   * Yucatec Maya
   */
  yua: "yua",

  /**
   * Irish
   */
  ga: "ga",

  /**
   * Kannada
   */
  kn: "kn",

  /**
   * Maori
   */
  mi: "mi",

  /**
   * Malayalam
   */
  ml: "ml",

  /**
   * Punjabi
   */
  pa: "pa",
}

/**
 * Controls the cardinality of the output produced by the skill. Default is 'oneToMany'
 */
@added(Versions.v2024_11_01_preview)
union DocumentIntelligenceLayoutSkillOutputMode {
  string,

  /**
   * Specify the deepest markdown header section to parse.
   */
  OneToMany: "oneToMany",
}

/**
 * The depth of headers in the markdown output. Default is h6.
 */
@added(Versions.v2024_11_01_preview)
union DocumentIntelligenceLayoutSkillMarkdownHeaderDepth {
  string,

  /**
   * Header level 1.
   */
  H1: "h1",

  /**
   * Header level 2.
   */
  H2: "h2",

  /**
   * Header level 3.
   */
  H3: "h3",

  /**
   * Header level 4.
   */
  H4: "h4",

  /**
   * Header level 5.
   */
  H5: "h5",

  /**
   * Header level 6.
   */
  H6: "h6",
}

/**
 * Represents the overall indexer status.
 */
union IndexerStatus {
  string,

  /**
   * Indicates that the indexer is in an unknown state.
   */
  Unknown: "unknown",

  /**
   * Indicates that the indexer experienced an error that cannot be corrected
   * without human intervention.
   */
  Error: "error",

  /**
   * Indicates that the indexer is running normally.
   */
  Running: "running",
}

/**
 * Represents the status of an individual indexer execution.
 */
union IndexerExecutionStatus {
  string,

  /**
   * An indexer invocation has failed, but the failure may be transient. Indexer
   * invocations will continue per schedule.
   */
  TransientFailure: "transientFailure",

  /**
   * Indexer execution completed successfully.
   */
  Success: "success",

  /**
   * Indexer execution is in progress.
   */
  InProgress: "inProgress",

  /**
   * Indexer has been reset.
   */
  Reset: "reset",
}

/**
 * Defines the function used to interpolate score boosting across a range of
 * documents.
 */
union ScoringFunctionInterpolation {
  string,

  /**
   * Boosts scores by a linearly decreasing amount. This is the default
   * interpolation for scoring functions.
   */
  Linear: "linear",

  /**
   * Boosts scores by a constant factor.
   */
  Constant: "constant",

  /**
   * Boosts scores by an amount that decreases quadratically. Boosts decrease slowly
   * for higher scores, and more quickly as the scores decrease. This interpolation
   * option is not allowed in tag scoring functions.
   */
  Quadratic: "quadratic",

  /**
   * Boosts scores by an amount that decreases logarithmically. Boosts decrease
   * quickly for higher scores, and more slowly as the scores decrease. This
   * interpolation option is not allowed in tag scoring functions.
   */
  Logarithmic: "logarithmic",
}

/**
 * Defines the aggregation function used to combine the results of all the scoring
 * functions in a scoring profile.
 */
union ScoringFunctionAggregation {
  string,

  /**
   * Boost scores by the sum of all scoring function results.
   */
  Sum: "sum",

  /**
   * Boost scores by the average of all scoring function results.
   */
  Average: "average",

  /**
   * Boost scores by the minimum of all scoring function results.
   */
  Minimum: "minimum",

  /**
   * Boost scores by the maximum of all scoring function results.
   */
  Maximum: "maximum",

  /**
   * Boost scores using the first applicable scoring function in the scoring profile.
   */
  FirstMatching: "firstMatching",
}

/**
 * Represents classes of characters on which a token filter can operate.
 */
union TokenCharacterKind {
  string,

  /**
   * Keeps letters in tokens.
   */
  Letter: "letter",

  /**
   * Keeps digits in tokens.
   */
  Digit: "digit",

  /**
   * Keeps whitespace in tokens.
   */
  Whitespace: "whitespace",

  /**
   * Keeps punctuation in tokens.
   */
  Punctuation: "punctuation",

  /**
   * Keeps symbols in tokens.
   */
  Symbol: "symbol",
}

/**
 * Lists the languages supported by the Microsoft language tokenizer.
 */
union MicrosoftTokenizerLanguage {
  string,

  /**
   * Selects the Microsoft tokenizer for Bangla.
   */
  Bangla: "bangla",

  /**
   * Selects the Microsoft tokenizer for Bulgarian.
   */
  Bulgarian: "bulgarian",

  /**
   * Selects the Microsoft tokenizer for Catalan.
   */
  Catalan: "catalan",

  /**
   * Selects the Microsoft tokenizer for Chinese (Simplified).
   */
  ChineseSimplified: "chineseSimplified",

  /**
   * Selects the Microsoft tokenizer for Chinese (Traditional).
   */
  ChineseTraditional: "chineseTraditional",

  /**
   * Selects the Microsoft tokenizer for Croatian.
   */
  Croatian: "croatian",

  /**
   * Selects the Microsoft tokenizer for Czech.
   */
  Czech: "czech",

  /**
   * Selects the Microsoft tokenizer for Danish.
   */
  Danish: "danish",

  /**
   * Selects the Microsoft tokenizer for Dutch.
   */
  Dutch: "dutch",

  /**
   * Selects the Microsoft tokenizer for English.
   */
  English: "english",

  /**
   * Selects the Microsoft tokenizer for French.
   */
  French: "french",

  /**
   * Selects the Microsoft tokenizer for German.
   */
  German: "german",

  /**
   * Selects the Microsoft tokenizer for Greek.
   */
  Greek: "greek",

  /**
   * Selects the Microsoft tokenizer for Gujarati.
   */
  Gujarati: "gujarati",

  /**
   * Selects the Microsoft tokenizer for Hindi.
   */
  Hindi: "hindi",

  /**
   * Selects the Microsoft tokenizer for Icelandic.
   */
  Icelandic: "icelandic",

  /**
   * Selects the Microsoft tokenizer for Indonesian.
   */
  Indonesian: "indonesian",

  /**
   * Selects the Microsoft tokenizer for Italian.
   */
  Italian: "italian",

  /**
   * Selects the Microsoft tokenizer for Japanese.
   */
  Japanese: "japanese",

  /**
   * Selects the Microsoft tokenizer for Kannada.
   */
  Kannada: "kannada",

  /**
   * Selects the Microsoft tokenizer for Korean.
   */
  Korean: "korean",

  /**
   * Selects the Microsoft tokenizer for Malay.
   */
  Malay: "malay",

  /**
   * Selects the Microsoft tokenizer for Malayalam.
   */
  Malayalam: "malayalam",

  /**
   * Selects the Microsoft tokenizer for Marathi.
   */
  Marathi: "marathi",

  /**
   * Selects the Microsoft tokenizer for Norwegian (Bokmål).
   */
  NorwegianBokmaal: "norwegianBokmaal",

  /**
   * Selects the Microsoft tokenizer for Polish.
   */
  Polish: "polish",

  /**
   * Selects the Microsoft tokenizer for Portuguese.
   */
  Portuguese: "portuguese",

  /**
   * Selects the Microsoft tokenizer for Portuguese (Brazil).
   */
  PortugueseBrazilian: "portugueseBrazilian",

  /**
   * Selects the Microsoft tokenizer for Punjabi.
   */
  Punjabi: "punjabi",

  /**
   * Selects the Microsoft tokenizer for Romanian.
   */
  Romanian: "romanian",

  /**
   * Selects the Microsoft tokenizer for Russian.
   */
  Russian: "russian",

  /**
   * Selects the Microsoft tokenizer for Serbian (Cyrillic).
   */
  SerbianCyrillic: "serbianCyrillic",

  /**
   * Selects the Microsoft tokenizer for Serbian (Latin).
   */
  SerbianLatin: "serbianLatin",

  /**
   * Selects the Microsoft tokenizer for Slovenian.
   */
  Slovenian: "slovenian",

  /**
   * Selects the Microsoft tokenizer for Spanish.
   */
  Spanish: "spanish",

  /**
   * Selects the Microsoft tokenizer for Swedish.
   */
  Swedish: "swedish",

  /**
   * Selects the Microsoft tokenizer for Tamil.
   */
  Tamil: "tamil",

  /**
   * Selects the Microsoft tokenizer for Telugu.
   */
  Telugu: "telugu",

  /**
   * Selects the Microsoft tokenizer for Thai.
   */
  Thai: "thai",

  /**
   * Selects the Microsoft tokenizer for Ukrainian.
   */
  Ukrainian: "ukrainian",

  /**
   * Selects the Microsoft tokenizer for Urdu.
   */
  Urdu: "urdu",

  /**
   * Selects the Microsoft tokenizer for Vietnamese.
   */
  Vietnamese: "vietnamese",
}

/**
 * Lists the languages supported by the Microsoft language stemming tokenizer.
 */
union MicrosoftStemmingTokenizerLanguage {
  string,

  /**
   * Selects the Microsoft stemming tokenizer for Arabic.
   */
  Arabic: "arabic",

  /**
   * Selects the Microsoft stemming tokenizer for Bangla.
   */
  Bangla: "bangla",

  /**
   * Selects the Microsoft stemming tokenizer for Bulgarian.
   */
  Bulgarian: "bulgarian",

  /**
   * Selects the Microsoft stemming tokenizer for Catalan.
   */
  Catalan: "catalan",

  /**
   * Selects the Microsoft stemming tokenizer for Croatian.
   */
  Croatian: "croatian",

  /**
   * Selects the Microsoft stemming tokenizer for Czech.
   */
  Czech: "czech",

  /**
   * Selects the Microsoft stemming tokenizer for Danish.
   */
  Danish: "danish",

  /**
   * Selects the Microsoft stemming tokenizer for Dutch.
   */
  Dutch: "dutch",

  /**
   * Selects the Microsoft stemming tokenizer for English.
   */
  English: "english",

  /**
   * Selects the Microsoft stemming tokenizer for Estonian.
   */
  Estonian: "estonian",

  /**
   * Selects the Microsoft stemming tokenizer for Finnish.
   */
  Finnish: "finnish",

  /**
   * Selects the Microsoft stemming tokenizer for French.
   */
  French: "french",

  /**
   * Selects the Microsoft stemming tokenizer for German.
   */
  German: "german",

  /**
   * Selects the Microsoft stemming tokenizer for Greek.
   */
  Greek: "greek",

  /**
   * Selects the Microsoft stemming tokenizer for Gujarati.
   */
  Gujarati: "gujarati",

  /**
   * Selects the Microsoft stemming tokenizer for Hebrew.
   */
  Hebrew: "hebrew",

  /**
   * Selects the Microsoft stemming tokenizer for Hindi.
   */
  Hindi: "hindi",

  /**
   * Selects the Microsoft stemming tokenizer for Hungarian.
   */
  Hungarian: "hungarian",

  /**
   * Selects the Microsoft stemming tokenizer for Icelandic.
   */
  Icelandic: "icelandic",

  /**
   * Selects the Microsoft stemming tokenizer for Indonesian.
   */
  Indonesian: "indonesian",

  /**
   * Selects the Microsoft stemming tokenizer for Italian.
   */
  Italian: "italian",

  /**
   * Selects the Microsoft stemming tokenizer for Kannada.
   */
  Kannada: "kannada",

  /**
   * Selects the Microsoft stemming tokenizer for Latvian.
   */
  Latvian: "latvian",

  /**
   * Selects the Microsoft stemming tokenizer for Lithuanian.
   */
  Lithuanian: "lithuanian",

  /**
   * Selects the Microsoft stemming tokenizer for Malay.
   */
  Malay: "malay",

  /**
   * Selects the Microsoft stemming tokenizer for Malayalam.
   */
  Malayalam: "malayalam",

  /**
   * Selects the Microsoft stemming tokenizer for Marathi.
   */
  Marathi: "marathi",

  /**
   * Selects the Microsoft stemming tokenizer for Norwegian (Bokmål).
   */
  NorwegianBokmaal: "norwegianBokmaal",

  /**
   * Selects the Microsoft stemming tokenizer for Polish.
   */
  Polish: "polish",

  /**
   * Selects the Microsoft stemming tokenizer for Portuguese.
   */
  Portuguese: "portuguese",

  /**
   * Selects the Microsoft stemming tokenizer for Portuguese (Brazil).
   */
  PortugueseBrazilian: "portugueseBrazilian",

  /**
   * Selects the Microsoft stemming tokenizer for Punjabi.
   */
  Punjabi: "punjabi",

  /**
   * Selects the Microsoft stemming tokenizer for Romanian.
   */
  Romanian: "romanian",

  /**
   * Selects the Microsoft stemming tokenizer for Russian.
   */
  Russian: "russian",

  /**
   * Selects the Microsoft stemming tokenizer for Serbian (Cyrillic).
   */
  SerbianCyrillic: "serbianCyrillic",

  /**
   * Selects the Microsoft stemming tokenizer for Serbian (Latin).
   */
  SerbianLatin: "serbianLatin",

  /**
   * Selects the Microsoft stemming tokenizer for Slovak.
   */
  Slovak: "slovak",

  /**
   * Selects the Microsoft stemming tokenizer for Slovenian.
   */
  Slovenian: "slovenian",

  /**
   * Selects the Microsoft stemming tokenizer for Spanish.
   */
  Spanish: "spanish",

  /**
   * Selects the Microsoft stemming tokenizer for Swedish.
   */
  Swedish: "swedish",

  /**
   * Selects the Microsoft stemming tokenizer for Tamil.
   */
  Tamil: "tamil",

  /**
   * Selects the Microsoft stemming tokenizer for Telugu.
   */
  Telugu: "telugu",

  /**
   * Selects the Microsoft stemming tokenizer for Turkish.
   */
  Turkish: "turkish",

  /**
   * Selects the Microsoft stemming tokenizer for Ukrainian.
   */
  Ukrainian: "ukrainian",

  /**
   * Selects the Microsoft stemming tokenizer for Urdu.
   */
  Urdu: "urdu",
}

/**
 * Scripts that can be ignored by CjkBigramTokenFilter.
 */
union CjkBigramTokenFilterScripts {
  string,

  /**
   * Ignore Han script when forming bigrams of CJK terms.
   */
  Han: "han",

  /**
   * Ignore Hiragana script when forming bigrams of CJK terms.
   */
  Hiragana: "hiragana",

  /**
   * Ignore Katakana script when forming bigrams of CJK terms.
   */
  Katakana: "katakana",

  /**
   * Ignore Hangul script when forming bigrams of CJK terms.
   */
  Hangul: "hangul",
}

/**
 * Specifies which side of the input an n-gram should be generated from.
 */
union EdgeNGramTokenFilterSide {
  string,

  /**
   * Specifies that the n-gram should be generated from the front of the input.
   */
  Front: "front",

  /**
   * Specifies that the n-gram should be generated from the back of the input.
   */
  Back: "back",
}

/**
 * Identifies the type of phonetic encoder to use with a PhoneticTokenFilter.
 */
union PhoneticEncoder {
  string,

  /**
   * Encodes a token into a Metaphone value.
   */
  Metaphone: "metaphone",

  /**
   * Encodes a token into a double metaphone value.
   */
  DoubleMetaphone: "doubleMetaphone",

  /**
   * Encodes a token into a Soundex value.
   */
  Soundex: "soundex",

  /**
   * Encodes a token into a Refined Soundex value.
   */
  RefinedSoundex: "refinedSoundex",

  /**
   * Encodes a token into a Caverphone 1.0 value.
   */
  Caverphone1: "caverphone1",

  /**
   * Encodes a token into a Caverphone 2.0 value.
   */
  Caverphone2: "caverphone2",

  /**
   * Encodes a token into a Cologne Phonetic value.
   */
  Cologne: "cologne",

  /**
   * Encodes a token into a NYSIIS value.
   */
  Nysiis: "nysiis",

  /**
   * Encodes a token using the Kölner Phonetik algorithm.
   */
  KoelnerPhonetik: "koelnerPhonetik",

  /**
   * Encodes a token using the Haase refinement of the Kölner Phonetik algorithm.
   */
  HaasePhonetik: "haasePhonetik",

  /**
   * Encodes a token into a Beider-Morse value.
   */
  BeiderMorse: "beiderMorse",
}

/**
 * The language to use for a Snowball token filter.
 */
union SnowballTokenFilterLanguage {
  string,

  /**
   * Selects the Lucene Snowball stemming tokenizer for Armenian.
   */
  Armenian: "armenian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Basque.
   */
  Basque: "basque",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Catalan.
   */
  Catalan: "catalan",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Danish.
   */
  Danish: "danish",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Dutch.
   */
  Dutch: "dutch",

  /**
   * Selects the Lucene Snowball stemming tokenizer for English.
   */
  English: "english",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Finnish.
   */
  Finnish: "finnish",

  /**
   * Selects the Lucene Snowball stemming tokenizer for French.
   */
  French: "french",

  /**
   * Selects the Lucene Snowball stemming tokenizer for German.
   */
  German: "german",

  /**
   * Selects the Lucene Snowball stemming tokenizer that uses the German variant
   * algorithm.
   */
  German2: "german2",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Hungarian.
   */
  Hungarian: "hungarian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Italian.
   */
  Italian: "italian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Dutch that uses the
   * Kraaij-Pohlmann stemming algorithm.
   */
  Kp: "kp",

  /**
   * Selects the Lucene Snowball stemming tokenizer for English that uses the Lovins
   * stemming algorithm.
   */
  Lovins: "lovins",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Norwegian.
   */
  Norwegian: "norwegian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for English that uses the Porter
   * stemming algorithm.
   */
  Porter: "porter",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Portuguese.
   */
  Portuguese: "portuguese",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Romanian.
   */
  Romanian: "romanian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Russian.
   */
  Russian: "russian",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Spanish.
   */
  Spanish: "spanish",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Swedish.
   */
  Swedish: "swedish",

  /**
   * Selects the Lucene Snowball stemming tokenizer for Turkish.
   */
  Turkish: "turkish",
}

/**
 * The language to use for a stemmer token filter.
 */
union StemmerTokenFilterLanguage {
  string,

  /**
   * Selects the Lucene stemming tokenizer for Arabic.
   */
  Arabic: "arabic",

  /**
   * Selects the Lucene stemming tokenizer for Armenian.
   */
  Armenian: "armenian",

  /**
   * Selects the Lucene stemming tokenizer for Basque.
   */
  Basque: "basque",

  /**
   * Selects the Lucene stemming tokenizer for Portuguese (Brazil).
   */
  Brazilian: "brazilian",

  /**
   * Selects the Lucene stemming tokenizer for Bulgarian.
   */
  Bulgarian: "bulgarian",

  /**
   * Selects the Lucene stemming tokenizer for Catalan.
   */
  Catalan: "catalan",

  /**
   * Selects the Lucene stemming tokenizer for Czech.
   */
  Czech: "czech",

  /**
   * Selects the Lucene stemming tokenizer for Danish.
   */
  Danish: "danish",

  /**
   * Selects the Lucene stemming tokenizer for Dutch.
   */
  Dutch: "dutch",

  /**
   * Selects the Lucene stemming tokenizer for Dutch that uses the Kraaij-Pohlmann
   * stemming algorithm.
   */
  DutchKp: "dutchKp",

  /**
   * Selects the Lucene stemming tokenizer for English.
   */
  English: "english",

  /**
   * Selects the Lucene stemming tokenizer for English that does light stemming.
   */
  LightEnglish: "lightEnglish",

  /**
   * Selects the Lucene stemming tokenizer for English that does minimal stemming.
   */
  MinimalEnglish: "minimalEnglish",

  /**
   * Selects the Lucene stemming tokenizer for English that removes trailing
   * possessives from words.
   */
  PossessiveEnglish: "possessiveEnglish",

  /**
   * Selects the Lucene stemming tokenizer for English that uses the Porter2
   * stemming algorithm.
   */
  Porter2: "porter2",

  /**
   * Selects the Lucene stemming tokenizer for English that uses the Lovins stemming
   * algorithm.
   */
  Lovins: "lovins",

  /**
   * Selects the Lucene stemming tokenizer for Finnish.
   */
  Finnish: "finnish",

  /**
   * Selects the Lucene stemming tokenizer for Finnish that does light stemming.
   */
  LightFinnish: "lightFinnish",

  /**
   * Selects the Lucene stemming tokenizer for French.
   */
  French: "french",

  /**
   * Selects the Lucene stemming tokenizer for French that does light stemming.
   */
  LightFrench: "lightFrench",

  /**
   * Selects the Lucene stemming tokenizer for French that does minimal stemming.
   */
  MinimalFrench: "minimalFrench",

  /**
   * Selects the Lucene stemming tokenizer for Galician.
   */
  Galician: "galician",

  /**
   * Selects the Lucene stemming tokenizer for Galician that does minimal stemming.
   */
  MinimalGalician: "minimalGalician",

  /**
   * Selects the Lucene stemming tokenizer for German.
   */
  German: "german",

  /**
   * Selects the Lucene stemming tokenizer that uses the German variant algorithm.
   */
  German2: "german2",

  /**
   * Selects the Lucene stemming tokenizer for German that does light stemming.
   */
  LightGerman: "lightGerman",

  /**
   * Selects the Lucene stemming tokenizer for German that does minimal stemming.
   */
  MinimalGerman: "minimalGerman",

  /**
   * Selects the Lucene stemming tokenizer for Greek.
   */
  Greek: "greek",

  /**
   * Selects the Lucene stemming tokenizer for Hindi.
   */
  Hindi: "hindi",

  /**
   * Selects the Lucene stemming tokenizer for Hungarian.
   */
  Hungarian: "hungarian",

  /**
   * Selects the Lucene stemming tokenizer for Hungarian that does light stemming.
   */
  LightHungarian: "lightHungarian",

  /**
   * Selects the Lucene stemming tokenizer for Indonesian.
   */
  Indonesian: "indonesian",

  /**
   * Selects the Lucene stemming tokenizer for Irish.
   */
  Irish: "irish",

  /**
   * Selects the Lucene stemming tokenizer for Italian.
   */
  Italian: "italian",

  /**
   * Selects the Lucene stemming tokenizer for Italian that does light stemming.
   */
  LightItalian: "lightItalian",

  /**
   * Selects the Lucene stemming tokenizer for Sorani.
   */
  Sorani: "sorani",

  /**
   * Selects the Lucene stemming tokenizer for Latvian.
   */
  Latvian: "latvian",

  /**
   * Selects the Lucene stemming tokenizer for Norwegian (Bokmål).
   */
  Norwegian: "norwegian",

  /**
   * Selects the Lucene stemming tokenizer for Norwegian (Bokmål) that does light
   * stemming.
   */
  LightNorwegian: "lightNorwegian",

  /**
   * Selects the Lucene stemming tokenizer for Norwegian (Bokmål) that does minimal
   * stemming.
   */
  MinimalNorwegian: "minimalNorwegian",

  /**
   * Selects the Lucene stemming tokenizer for Norwegian (Nynorsk) that does light
   * stemming.
   */
  LightNynorsk: "lightNynorsk",

  /**
   * Selects the Lucene stemming tokenizer for Norwegian (Nynorsk) that does minimal
   * stemming.
   */
  MinimalNynorsk: "minimalNynorsk",

  /**
   * Selects the Lucene stemming tokenizer for Portuguese.
   */
  Portuguese: "portuguese",

  /**
   * Selects the Lucene stemming tokenizer for Portuguese that does light stemming.
   */
  LightPortuguese: "lightPortuguese",

  /**
   * Selects the Lucene stemming tokenizer for Portuguese that does minimal stemming.
   */
  MinimalPortuguese: "minimalPortuguese",

  /**
   * Selects the Lucene stemming tokenizer for Portuguese that uses the RSLP
   * stemming algorithm.
   */
  PortugueseRslp: "portugueseRslp",

  /**
   * Selects the Lucene stemming tokenizer for Romanian.
   */
  Romanian: "romanian",

  /**
   * Selects the Lucene stemming tokenizer for Russian.
   */
  Russian: "russian",

  /**
   * Selects the Lucene stemming tokenizer for Russian that does light stemming.
   */
  LightRussian: "lightRussian",

  /**
   * Selects the Lucene stemming tokenizer for Spanish.
   */
  Spanish: "spanish",

  /**
   * Selects the Lucene stemming tokenizer for Spanish that does light stemming.
   */
  LightSpanish: "lightSpanish",

  /**
   * Selects the Lucene stemming tokenizer for Swedish.
   */
  Swedish: "swedish",

  /**
   * Selects the Lucene stemming tokenizer for Swedish that does light stemming.
   */
  LightSwedish: "lightSwedish",

  /**
   * Selects the Lucene stemming tokenizer for Turkish.
   */
  Turkish: "turkish",
}

/**
 * Identifies a predefined list of language-specific stopwords.
 */
union StopwordsList {
  string,

  /**
   * Selects the stopword list for Arabic.
   */
  Arabic: "arabic",

  /**
   * Selects the stopword list for Armenian.
   */
  Armenian: "armenian",

  /**
   * Selects the stopword list for Basque.
   */
  Basque: "basque",

  /**
   * Selects the stopword list for Portuguese (Brazil).
   */
  Brazilian: "brazilian",

  /**
   * Selects the stopword list for Bulgarian.
   */
  Bulgarian: "bulgarian",

  /**
   * Selects the stopword list for Catalan.
   */
  Catalan: "catalan",

  /**
   * Selects the stopword list for Czech.
   */
  Czech: "czech",

  /**
   * Selects the stopword list for Danish.
   */
  Danish: "danish",

  /**
   * Selects the stopword list for Dutch.
   */
  Dutch: "dutch",

  /**
   * Selects the stopword list for English.
   */
  English: "english",

  /**
   * Selects the stopword list for Finnish.
   */
  Finnish: "finnish",

  /**
   * Selects the stopword list for French.
   */
  French: "french",

  /**
   * Selects the stopword list for Galician.
   */
  Galician: "galician",

  /**
   * Selects the stopword list for German.
   */
  German: "german",

  /**
   * Selects the stopword list for Greek.
   */
  Greek: "greek",

  /**
   * Selects the stopword list for Hindi.
   */
  Hindi: "hindi",

  /**
   * Selects the stopword list for Hungarian.
   */
  Hungarian: "hungarian",

  /**
   * Selects the stopword list for Indonesian.
   */
  Indonesian: "indonesian",

  /**
   * Selects the stopword list for Irish.
   */
  Irish: "irish",

  /**
   * Selects the stopword list for Italian.
   */
  Italian: "italian",

  /**
   * Selects the stopword list for Latvian.
   */
  Latvian: "latvian",

  /**
   * Selects the stopword list for Norwegian.
   */
  Norwegian: "norwegian",

  /**
   * Selects the stopword list for Persian.
   */
  Persian: "persian",

  /**
   * Selects the stopword list for Portuguese.
   */
  Portuguese: "portuguese",

  /**
   * Selects the stopword list for Romanian.
   */
  Romanian: "romanian",

  /**
   * Selects the stopword list for Russian.
   */
  Russian: "russian",

  /**
   * Selects the stopword list for Sorani.
   */
  Sorani: "sorani",

  /**
   * Selects the stopword list for Spanish.
   */
  Spanish: "spanish",

  /**
   * Selects the stopword list for Swedish.
   */
  Swedish: "swedish",

  /**
   * Selects the stopword list for Thai.
   */
  Thai: "thai",

  /**
   * Selects the stopword list for Turkish.
   */
  Turkish: "turkish",
}

/**
 * Represents a datasource definition, which can be used to configure an indexer.
 */
model SearchIndexerDataSource {
  /**
   * The name of the datasource.
   */
  name: string;

  /**
   * The description of the datasource.
   */
  description?: string;

  /**
   * The type of the datasource.
   */
  type: SearchIndexerDataSourceType;

  /**
   * Credentials for the datasource.
   */
  credentials: DataSourceCredentials;

  /**
   * The data container for the datasource.
   */
  container: SearchIndexerDataContainer;

  /**
   * An explicit managed identity to use for this datasource. If not specified and
   * the connection string is a managed identity, the system-assigned managed
   * identity is used. If not specified, the value remains unchanged. If "none" is
   * specified, the value of this property is cleared.
   */
  @added(Versions.v2024_11_01_preview)
  identity?: SearchIndexerDataIdentity;

  /**
   * The data change detection policy for the datasource.
   */
  dataChangeDetectionPolicy?: DataChangeDetectionPolicy;

  /**
   * The data deletion detection policy for the datasource.
   */
  dataDeletionDetectionPolicy?: DataDeletionDetectionPolicy;

  /**
   * The ETag of the data source.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;

  /**
   * A description of an encryption key that you create in Azure Key Vault. This key
   * is used to provide an additional level of encryption-at-rest for your
   * datasource definition when you want full assurance that no one, not even
   * Microsoft, can decrypt your data source definition. Once you have encrypted
   * your data source definition, it will always remain encrypted. The search
   * service will ignore attempts to set this property to null. You can change this
   * property as needed if you want to rotate your encryption key; Your datasource
   * definition will be unaffected. Encryption with customer-managed keys is not
   * available for free search services, and is only available for paid services
   * created on or after January 1, 2019.
   */
  encryptionKey?: SearchResourceEncryptionKey;
}

/**
 * Represents credentials that can be used to connect to a datasource.
 */
model DataSourceCredentials {
  /**
   * The connection string for the datasource. Set to `<unchanged>` (with brackets)
   * if you don't want the connection string updated. Set to `<redacted>` if you
   * want to remove the connection string value from the datasource.
   */
  connectionString?: string;
}

/**
 * Represents information about the entity (such as Azure SQL table or CosmosDB
 * collection) that will be indexed.
 */
model SearchIndexerDataContainer {
  /**
   * The name of the table or view (for Azure SQL data source) or collection (for
   * CosmosDB data source) that will be indexed.
   */
  name: string;

  /**
   * A query that is applied to this data container. The syntax and meaning of this
   * parameter is datasource-specific. Not supported by Azure SQL datasources.
   */
  query?: string;
}

/**
 * Base type for data change detection policies.
 */
@discriminator("@odata.type")
model DataChangeDetectionPolicy {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;
}

/**
 * Base type for data deletion detection policies.
 */
@discriminator("@odata.type")
model DataDeletionDetectionPolicy {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;
}

/**
 * A customer-managed encryption key in Azure Key Vault. Keys that you create and
 * manage can be used to encrypt or decrypt data-at-rest, such as indexes and
 * synonym maps.
 */
model SearchResourceEncryptionKey {
  /**
   * The name of your Azure Key Vault key to be used to encrypt your data at rest.
   */
  keyVaultKeyName: string;

  /**
   * The version of your Azure Key Vault key to be used to encrypt your data at rest.
   */
  keyVaultKeyVersion: string;

  /**
   * The URI of your Azure Key Vault, also referred to as DNS name, that contains
   * the key to be used to encrypt your data at rest. An example URI might be
   * `https://my-keyvault-name.vault.azure.net`.
   */
  keyVaultUri: string;

  /**
   * Optional Azure Active Directory credentials used for accessing your Azure Key
   * Vault. Not required if using managed identity instead.
   */
  accessCredentials?: AzureActiveDirectoryApplicationCredentials;

  /**
   * An explicit managed identity to use for this encryption key. If not specified
   * and the access credentials property is null, the system-assigned managed
   * identity is used. On update to the resource, if the explicit identity is
   * unspecified, it remains unchanged. If "none" is specified, the value of this
   * property is cleared.
   */
  @added(Versions.v2024_11_01_preview)
  identity?: SearchIndexerDataIdentity;
}

/**
 * Credentials of a registered application created for your search service, used
 * for authenticated access to the encryption keys stored in Azure Key Vault.
 */
model AzureActiveDirectoryApplicationCredentials {
  /**
   * An AAD Application ID that was granted the required access permissions to the
   * Azure Key Vault that is to be used when encrypting your data at rest. The
   * Application ID should not be confused with the Object ID for your AAD
   * Application.
   */
  applicationId: string;

  /**
   * The authentication key of the specified AAD application.
   */
  applicationSecret?: string;
}

/**
 * Response from a List Datasources request. If successful, it includes the full
 * definitions of all datasources.
 */
model ListDataSourcesResult {
  /**
   * The datasources in the Search service.
   */
  @visibility("read")
  value: SearchIndexerDataSource[];
}

@doc("The type of the keysOrIds.")
@added(Versions.v2024_11_01_preview)
model DocumentKeysOrIds {
  /**
   * document keys to be reset
   */
  documentKeys?: string[];

  /**
   * datasource document identifiers to be reset
   */
  datasourceDocumentIds?: string[];
}

/**
 * Represents an indexer.
 */
model SearchIndexer {
  /**
   * The name of the indexer.
   */
  name: string;

  /**
   * The description of the indexer.
   */
  description?: string;

  /**
   * The name of the datasource from which this indexer reads data.
   */
  dataSourceName: string;

  /**
   * The name of the skillset executing with this indexer.
   */
  skillsetName?: string;

  /**
   * The name of the index to which this indexer writes data.
   */
  targetIndexName: string;

  /**
   * The schedule for this indexer.
   */
  schedule?: IndexingSchedule;

  /**
   * Parameters for indexer execution.
   */
  parameters?: IndexingParameters;

  /**
   * Defines mappings between fields in the data source and corresponding target
   * fields in the index.
   */
  fieldMappings?: FieldMapping[];

  /**
   * Output field mappings are applied after enrichment and immediately before
   * indexing.
   */
  outputFieldMappings?: FieldMapping[];

  /**
   * A value indicating whether the indexer is disabled. Default is false.
   */
  disabled?: boolean;

  /**
   * The ETag of the indexer.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;

  /**
   * A description of an encryption key that you create in Azure Key Vault. This key
   * is used to provide an additional level of encryption-at-rest for your indexer
   * definition (as well as indexer execution status) when you want full assurance
   * that no one, not even Microsoft, can decrypt them. Once you have encrypted your
   * indexer definition, it will always remain encrypted. The search service will
   * ignore attempts to set this property to null. You can change this property as
   * needed if you want to rotate your encryption key; Your indexer definition (and
   * indexer execution status) will be unaffected. Encryption with customer-managed
   * keys is not available for free search services, and is only available for paid
   * services created on or after January 1, 2019.
   */
  encryptionKey?: SearchResourceEncryptionKey;

  /**
   * Adds caching to an enrichment pipeline to allow for incremental modification
   * steps without having to rebuild the index every time.
   */
  @added(Versions.v2024_11_01_preview)
  cache?: SearchIndexerCache;
}

/**
 * Represents a schedule for indexer execution.
 */
model IndexingSchedule {
  /**
   * The interval of time between indexer executions.
   */
  interval: duration;

  /**
   * The time when an indexer should start running.
   */
  startTime?: utcDateTime;
}

/**
 * Represents parameters for indexer execution.
 */
model IndexingParameters {
  /**
   * The number of items that are read from the data source and indexed as a single
   * batch in order to improve performance. The default depends on the data source
   * type.
   */
  batchSize?: int32;

  /**
   * The maximum number of items that can fail indexing for indexer execution to
   * still be considered successful. -1 means no limit. Default is 0.
   */
  maxFailedItems?: int32;

  /**
   * The maximum number of items in a single batch that can fail indexing for the
   * batch to still be considered successful. -1 means no limit. Default is 0.
   */
  maxFailedItemsPerBatch?: int32;

  /**
   * A dictionary of indexer-specific configuration properties. Each name is the
   * name of a specific property. Each value must be of a primitive type.
   */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
  configuration?: IndexingParametersConfiguration;
}

/**
 * A dictionary of indexer-specific configuration properties. Each name is the
 * name of a specific property. Each value must be of a primitive type.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model IndexingParametersConfiguration {
  ...Record<unknown>;

  /**
   * Represents the parsing mode for indexing from an Azure blob data source.
   */
  parsingMode?: BlobIndexerParsingMode = BlobIndexerParsingMode.Default;

  /**
   * Comma-delimited list of filename extensions to ignore when processing from
   * Azure blob storage.  For example, you could exclude ".png, .mp4" to skip over
   * those files during indexing.
   */
  excludedFileNameExtensions?: string;

  /**
   * Comma-delimited list of filename extensions to select when processing from
   * Azure blob storage.  For example, you could focus indexing on specific
   * application files ".docx, .pptx, .msg" to specifically include those file
   * types.
   */
  indexedFileNameExtensions?: string;

  /**
   * For Azure blobs, set to false if you want to continue indexing when an
   * unsupported content type is encountered, and you don't know all the content
   * types (file extensions) in advance.
   */
  failOnUnsupportedContentType?: boolean;

  /**
   * For Azure blobs, set to false if you want to continue indexing if a document
   * fails indexing.
   */
  failOnUnprocessableDocument?: boolean;

  /**
   * For Azure blobs, set this property to true to still index storage metadata for
   * blob content that is too large to process. Oversized blobs are treated as
   * errors by default. For limits on blob size, see
   * https://learn.microsoft.com/azure/search/search-limits-quotas-capacity.
   */
  indexStorageMetadataOnlyForOversizedDocuments?: boolean;

  /**
   * For CSV blobs, specifies a comma-delimited list of column headers, useful for
   * mapping source fields to destination fields in an index.
   */
  delimitedTextHeaders?: string;

  /**
   * For CSV blobs, specifies the end-of-line single-character delimiter for CSV
   * files where each line starts a new document (for example, "|").
   */
  delimitedTextDelimiter?: string;

  /**
   * For CSV blobs, indicates that the first (non-blank) line of each blob contains
   * headers.
   */
  firstLineContainsHeaders?: boolean = true;

  /**
   * Specifies the submode that will determine whether a markdown file will be
   * parsed into exactly one search document or multiple search documents. Default
   * is `oneToMany`.
   */
  @added(Versions.v2024_11_01_preview)
  markdownParsingSubmode?: MarkdownParsingSubmode = MarkdownParsingSubmode.OneToMany;

  /**
   * Specifies the max header depth that will be considered while grouping markdown
   * content. Default is `h6`.
   */
  @added(Versions.v2024_11_01_preview)
  markdownHeaderDepth?: MarkdownHeaderDepth = MarkdownHeaderDepth.h6;

  /**
   * For JSON arrays, given a structured or semi-structured document, you can
   * specify a path to the array using this property.
   */
  documentRoot?: string;

  /**
   * Specifies the data to extract from Azure blob storage and tells the indexer
   * which data to extract from image content when "imageAction" is set to a value
   * other than "none".  This applies to embedded image content in a .PDF or other
   * application, or image files such as .jpg and .png, in Azure blobs.
   */
  dataToExtract?: BlobIndexerDataToExtract = BlobIndexerDataToExtract.ContentAndMetadata;

  /**
   * Determines how to process embedded images and image files in Azure blob
   * storage.  Setting the "imageAction" configuration to any value other than
   * "none" requires that a skillset also be attached to that indexer.
   */
  imageAction?: BlobIndexerImageAction = BlobIndexerImageAction.None;

  /**
   * If true, will create a path //document//file_data that is an object
   * representing the original file data downloaded from your blob data source.
   * This allows you to pass the original file data to a custom skill for processing
   * within the enrichment pipeline, or to the Document Extraction skill.
   */
  allowSkillsetToReadFileData?: boolean;

  /**
   * Determines algorithm for text extraction from PDF files in Azure blob storage.
   */
  pdfTextRotationAlgorithm?: BlobIndexerPDFTextRotationAlgorithm = BlobIndexerPDFTextRotationAlgorithm.None;

  /**
   * Specifies the environment in which the indexer should execute.
   */
  executionEnvironment?: IndexerExecutionEnvironment = IndexerExecutionEnvironment.standard;

  /**
   * Increases the timeout beyond the 5-minute default for Azure SQL database data
   * sources, specified in the format "hh:mm:ss".
   */
  queryTimeout?: string = "00:05:00";
}

/**
 * Defines a mapping between a field in a data source and a target field in an
 * index.
 */
model FieldMapping {
  /**
   * The name of the field in the data source.
   */
  sourceFieldName: string;

  /**
   * The name of the target field in the index. Same as the source field name by
   * default.
   */
  targetFieldName?: string;

  /**
   * A function to apply to each source field value before indexing.
   */
  mappingFunction?: FieldMappingFunction;
}

/**
 * Represents a function that transforms a value from a data source before
 * indexing.
 */
model FieldMappingFunction {
  /**
   * The name of the field mapping function.
   */
  name: string;

  /**
   * A dictionary of parameter name/value pairs to pass to the function. Each value
   * must be of a primitive type.
   */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
  parameters?: Record<unknown>;
}

@doc("The type of the cache.")
@added(Versions.v2024_11_01_preview)
model SearchIndexerCache {
  /**
   * The connection string to the storage account where the cache data will be
   * persisted.
   */
  storageConnectionString?: string;

  /**
   * Specifies whether incremental reprocessing is enabled.
   */
  enableReprocessing?: boolean;

  /**
   * The user-assigned managed identity used for connections to the enrichment
   * cache.  If the connection string indicates an identity (ResourceId) and it's
   * not specified, the system-assigned managed identity is used. On updates to the
   * indexer, if the identity is unspecified, the value remains unchanged. If set to
   * "none", the value of this property is cleared.
   */
  identity?: SearchIndexerDataIdentity;
}

/**
 * Response from a List Indexers request. If successful, it includes the full
 * definitions of all indexers.
 */
model ListIndexersResult {
  /**
   * The indexers in the Search service.
   */
  @visibility("read")
  value: SearchIndexer[];
}

/**
 * Represents the current status and execution history of an indexer.
 */
model SearchIndexerStatus {
  /**
   * Overall indexer status.
   */
  @visibility("read")
  status: IndexerStatus;

  /**
   * The result of the most recent or an in-progress indexer execution.
   */
  @visibility("read")
  lastResult?: IndexerExecutionResult;

  /**
   * History of the recent indexer executions, sorted in reverse chronological order.
   */
  @visibility("read")
  executionHistory: IndexerExecutionResult[];

  /**
   * The execution limits for the indexer.
   */
  @visibility("read")
  limits: SearchIndexerLimits;
}

/**
 * Represents the result of an individual indexer execution.
 */
model IndexerExecutionResult {
  /**
   * The outcome of this indexer execution.
   */
  @visibility("read")
  status: IndexerExecutionStatus;

  /**
   * The outcome of this indexer execution.
   */
  @visibility("read")
  @added(Versions.v2024_11_01_preview)
  statusDetail?: IndexerExecutionStatusDetail;

  /**
   * All of the state that defines and dictates the indexer's current execution.
   */
  @visibility("read")
  @added(Versions.v2024_11_01_preview)
  currentState?: IndexerCurrentState;

  /**
   * The error message indicating the top-level error, if any.
   */
  @visibility("read")
  errorMessage?: string;

  /**
   * The start time of this indexer execution.
   */
  @visibility("read")
  startTime?: utcDateTime;

  /**
   * The end time of this indexer execution, if the execution has already completed.
   */
  @visibility("read")
  endTime?: utcDateTime;

  /**
   * The item-level indexing errors.
   */
  @visibility("read")
  errors: SearchIndexerError[];

  /**
   * The item-level indexing warnings.
   */
  @visibility("read")
  warnings: SearchIndexerWarning[];

  /**
   * The number of items that were processed during this indexer execution. This
   * includes both successfully processed items and items where indexing was
   * attempted but failed.
   */
  @visibility("read")
  itemsProcessed: int32;

  /**
   * The number of items that failed to be indexed during this indexer execution.
   */
  @visibility("read")
  itemsFailed: int32;

  /**
   * Change tracking state with which an indexer execution started.
   */
  @visibility("read")
  initialTrackingState?: string;

  /**
   * Change tracking state with which an indexer execution finished.
   */
  @visibility("read")
  finalTrackingState?: string;
}

/**
 * Represents all of the state that defines and dictates the indexer's current
 * execution.
 */
@added(Versions.v2024_11_01_preview)
model IndexerCurrentState {
  /**
   * The mode the indexer is running in.
   */
  @visibility("read")
  mode?: IndexingMode;

  /**
   * Change tracking state used when indexing starts on all documents in the
   * datasource.
   */
  @visibility("read")
  allDocsInitialChangeTrackingState?: string;

  /**
   * Change tracking state value when indexing finishes on all documents in the
   * datasource.
   */
  @visibility("read")
  allDocsFinalChangeTrackingState?: string;

  /**
   * Change tracking state used when indexing starts on select, reset documents in
   * the datasource.
   */
  @visibility("read")
  resetDocsInitialChangeTrackingState?: string;

  /**
   * Change tracking state value when indexing finishes on select, reset documents
   * in the datasource.
   */
  @visibility("read")
  resetDocsFinalChangeTrackingState?: string;

  /**
   * The list of document keys that have been reset. The document key is the
   * document's unique identifier for the data in the search index. The indexer will
   * prioritize selectively re-ingesting these keys.
   */
  @visibility("read")
  resetDocumentKeys?: string[];

  /**
   * The list of datasource document ids that have been reset. The datasource
   * document id is the unique identifier for the data in the datasource. The
   * indexer will prioritize selectively re-ingesting these ids.
   */
  @visibility("read")
  resetDatasourceDocumentIds?: string[];
}

/**
 * Represents an item- or document-level indexing error.
 */
@error
model SearchIndexerError {
  /**
   * The key of the item for which indexing failed.
   */
  @visibility("read")
  key?: string;

  /**
   * The message describing the error that occurred while processing the item.
   */
  @visibility("read")
  errorMessage: string;

  /**
   * The status code indicating why the indexing operation failed. Possible values
   * include: 400 for a malformed input document, 404 for document not found, 409
   * for a version conflict, 422 when the index is temporarily unavailable, or 503
   * for when the service is too busy.
   */
  @visibility("read")
  statusCode: int32;

  /**
   * The name of the source at which the error originated. For example, this could
   * refer to a particular skill in the attached skillset. This may not be always
   * available.
   */
  @visibility("read")
  name?: string;

  /**
   * Additional, verbose details about the error to assist in debugging the indexer.
   * This may not be always available.
   */
  @visibility("read")
  details?: string;

  /**
   * A link to a troubleshooting guide for these classes of errors. This may not be
   * always available.
   */
  @visibility("read")
  documentationLink?: string;
}

/**
 * Represents an item-level warning.
 */
model SearchIndexerWarning {
  /**
   * The key of the item which generated a warning.
   */
  @visibility("read")
  key?: string;

  /**
   * The message describing the warning that occurred while processing the item.
   */
  @visibility("read")
  message: string;

  /**
   * The name of the source at which the warning originated. For example, this could
   * refer to a particular skill in the attached skillset. This may not be always
   * available.
   */
  @visibility("read")
  name?: string;

  /**
   * Additional, verbose details about the warning to assist in debugging the
   * indexer. This may not be always available.
   */
  @visibility("read")
  details?: string;

  /**
   * A link to a troubleshooting guide for these classes of warnings. This may not
   * be always available.
   */
  @visibility("read")
  documentationLink?: string;
}

/**
 * Represents the limits that can be applied to an indexer.
 */
model SearchIndexerLimits {
  /**
   * The maximum duration that the indexer is permitted to run for one execution.
   */
  @visibility("read")
  maxRunTime?: duration;

  /**
   * The maximum size of a document, in bytes, which will be considered valid for
   * indexing.
   */
  @visibility("read")
  maxDocumentExtractionSize?: int64;

  /**
   * The maximum number of characters that will be extracted from a document picked
   * up for indexing.
   */
  @visibility("read")
  maxDocumentContentCharactersToExtract?: int64;
}

/**
 * A list of skills.
 */
model SearchIndexerSkillset {
  /**
   * The name of the skillset.
   */
  name: string;

  /**
   * The description of the skillset.
   */
  description?: string;

  /**
   * A list of skills in the skillset.
   */
  skills: SearchIndexerSkill[];

  /**
   * Details about the Azure AI service to be used when running skills.
   */
  cognitiveServices?: CognitiveServicesAccount;

  /**
   * Definition of additional projections to Azure blob, table, or files, of
   * enriched data.
   */
  knowledgeStore?: SearchIndexerKnowledgeStore;

  /**
   * Definition of additional projections to secondary search index(es).
   */
  indexProjections?: SearchIndexerIndexProjection;

  /**
   * The ETag of the skillset.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;

  /**
   * A description of an encryption key that you create in Azure Key Vault. This key
   * is used to provide an additional level of encryption-at-rest for your skillset
   * definition when you want full assurance that no one, not even Microsoft, can
   * decrypt your skillset definition. Once you have encrypted your skillset
   * definition, it will always remain encrypted. The search service will ignore
   * attempts to set this property to null. You can change this property as needed
   * if you want to rotate your encryption key; Your skillset definition will be
   * unaffected. Encryption with customer-managed keys is not available for free
   * search services, and is only available for paid services created on or after
   * January 1, 2019.
   */
  encryptionKey?: SearchResourceEncryptionKey;
}

/**
 * Base type for skills.
 */
@discriminator("@odata.type")
model SearchIndexerSkill {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the skill which uniquely identifies it within the skillset. A skill
   * with no name defined will be given a default name of its 1-based index in the
   * skills array, prefixed with the character '#'.
   */
  name?: string;

  /**
   * The description of the skill which describes the inputs, outputs, and usage of
   * the skill.
   */
  description?: string;

  /**
   * Represents the level at which operations take place, such as the document root
   * or document content (for example, /document or /document/content). The default
   * is /document.
   */
  context?: string;

  /**
   * Inputs of the skills could be a column in the source data set, or the output of
   * an upstream skill.
   */
  inputs: InputFieldMappingEntry[];

  /**
   * The output of a skill is either a field in a search index, or a value that can
   * be consumed as an input by another skill.
   */
  outputs: OutputFieldMappingEntry[];
}

/**
 * Input field mapping for a skill.
 */
model InputFieldMappingEntry {
  /**
   * The name of the input.
   */
  name: string;

  /**
   * The source of the input.
   */
  source?: string;

  /**
   * The source context used for selecting recursive inputs.
   */
  sourceContext?: string;

  /**
   * The recursive inputs used when creating a complex type.
   */
  inputs?: InputFieldMappingEntry[];
}

/**
 * Output field mapping for a skill.
 */
model OutputFieldMappingEntry {
  /**
   * The name of the output defined by the skill.
   */
  name: string;

  /**
   * The target name of the output. It is optional and default to name.
   */
  targetName?: string;
}

/**
 * Base type for describing any Azure AI service resource attached to a skillset.
 */
@discriminator("@odata.type")
model CognitiveServicesAccount {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * Description of the Azure AI service resource attached to a skillset.
   */
  description?: string;
}

/**
 * Definition of additional projections to azure blob, table, or files, of
 * enriched data.
 */
model SearchIndexerKnowledgeStore {
  /**
   * The connection string to the storage account projections will be stored in.
   */
  storageConnectionString: string;

  /**
   * A list of additional projections to perform during indexing.
   */
  projections: SearchIndexerKnowledgeStoreProjection[];

  /**
   * The user-assigned managed identity used for connections to Azure Storage when
   * writing knowledge store projections. If the connection string indicates an
   * identity (ResourceId) and it's not specified, the system-assigned managed
   * identity is used. On updates to the indexer, if the identity is unspecified,
   * the value remains unchanged. If set to "none", the value of this property is
   * cleared.
   */
  @added(Versions.v2024_11_01_preview)
  identity?: SearchIndexerDataIdentity;

  /**
   * A dictionary of knowledge store-specific configuration properties. Each name is
   * the name of a specific property. Each value must be of a primitive type.
   */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
  @added(Versions.v2024_11_01_preview)
  parameters?: SearchIndexerKnowledgeStoreParameters;
}

/**
 * Container object for various projection selectors.
 */
model SearchIndexerKnowledgeStoreProjection {
  /**
   * Projections to Azure Table storage.
   */
  tables?: SearchIndexerKnowledgeStoreTableProjectionSelector[];

  /**
   * Projections to Azure Blob storage.
   */
  objects?: SearchIndexerKnowledgeStoreObjectProjectionSelector[];

  /**
   * Projections to Azure File storage.
   */
  files?: SearchIndexerKnowledgeStoreFileProjectionSelector[];
}

/**
 * Description for what data to store in Azure Tables.
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
model SearchIndexerKnowledgeStoreTableProjectionSelector
  extends SearchIndexerKnowledgeStoreProjectionSelector {
  /**
   * Name of the Azure table to store projected data in.
   */
  tableName: string;
}

/**
 * Abstract class to share properties between concrete selectors.
 */
model SearchIndexerKnowledgeStoreProjectionSelector {
  /**
   * Name of reference key to different projection.
   */
  referenceKeyName?: string;

  /**
   * Name of generated key to store projection under.
   */
  generatedKeyName?: string;

  /**
   * Source data to project.
   */
  source?: string;

  /**
   * Source context for complex projections.
   */
  sourceContext?: string;

  /**
   * Nested inputs for complex projections.
   */
  inputs?: InputFieldMappingEntry[];
}

/**
 * Projection definition for what data to store in Azure Blob.
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
model SearchIndexerKnowledgeStoreObjectProjectionSelector
  extends SearchIndexerKnowledgeStoreBlobProjectionSelector {}

/**
 * Abstract class to share properties between concrete selectors.
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
model SearchIndexerKnowledgeStoreBlobProjectionSelector
  extends SearchIndexerKnowledgeStoreProjectionSelector {
  /**
   * Blob container to store projections in.
   */
  storageContainer: string;
}

/**
 * Projection definition for what data to store in Azure Files.
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
model SearchIndexerKnowledgeStoreFileProjectionSelector
  extends SearchIndexerKnowledgeStoreBlobProjectionSelector {}

/**
 * Definition of additional projections to secondary search indexes.
 */
model SearchIndexerIndexProjection {
  /**
   * A list of projections to be performed to secondary search indexes.
   */
  selectors: SearchIndexerIndexProjectionSelector[];

  /**
   * A dictionary of index projection-specific configuration properties. Each name
   * is the name of a specific property. Each value must be of a primitive type.
   */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
  parameters?: SearchIndexerIndexProjectionsParameters;
}

/**
 * Description for what data to store in the designated search index.
 */
model SearchIndexerIndexProjectionSelector {
  /**
   * Name of the search index to project to. Must have a key field with the 'keyword' analyzer set.
   */
  targetIndexName: string;

  /**
   * Name of the field in the search index to map the parent document's key value
   * to. Must be a string field that is filterable and not the key field.
   */
  parentKeyFieldName: string;

  /**
   * Source context for the projections. Represents the cardinality at which the
   * document will be split into multiple sub documents.
   */
  sourceContext: string;

  /**
   * Mappings for the projection, or which source should be mapped to which field in
   * the target index.
   */
  mappings: InputFieldMappingEntry[];
}

/**
 * A dictionary of index projection-specific configuration properties. Each name
 * is the name of a specific property. Each value must be of a primitive type.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model SearchIndexerIndexProjectionsParameters {
  ...Record<unknown>;

  /**
   * Defines behavior of the index projections in relation to the rest of the
   * indexer.
   */
  projectionMode?: IndexProjectionMode;
}

/**
 * Response from a list skillset request. If successful, it includes the full
 * definitions of all skillsets.
 */
model ListSkillsetsResult {
  /**
   * The skillsets defined in the Search service.
   */
  @visibility("read")
  value: SearchIndexerSkillset[];
}

#suppress "@azure-tools/typespec-azure-core/property-name-conflict"
@doc("The type of the skill names.")
@added(Versions.v2024_11_01_preview)
model SkillNames {
  /**
   * the names of skills to be reset.
   */
  skillNames?: string[];
}

/**
 * Represents a synonym map definition.
 */
model SynonymMap {
  /**
   * The name of the synonym map.
   */
  name: string;

  /**
   * The format of the synonym map. Only the 'solr' format is currently supported.
   */
  format: "solr";

  /**
   * A series of synonym rules in the specified synonym map format. The rules must
   * be separated by newlines.
   */
  synonyms: string;

  /**
   * A description of an encryption key that you create in Azure Key Vault. This key
   * is used to provide an additional level of encryption-at-rest for your data when
   * you want full assurance that no one, not even Microsoft, can decrypt your data.
   * Once you have encrypted your data, it will always remain encrypted. The search
   * service will ignore attempts to set this property to null. You can change this
   * property as needed if you want to rotate your encryption key; Your data will be
   * unaffected. Encryption with customer-managed keys is not available for free
   * search services, and is only available for paid services created on or after
   * January 1, 2019.
   */
  encryptionKey?: SearchResourceEncryptionKey;

  /**
   * The ETag of the synonym map.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;
}

/**
 * Response from a List SynonymMaps request. If successful, it includes the full
 * definitions of all synonym maps.
 */
model ListSynonymMapsResult {
  /**
   * The synonym maps in the Search service.
   */
  @visibility("read")
  value: SynonymMap[];
}

/**
 * Represents a search index definition, which describes the fields and search
 * behavior of an index.
 */
model SearchIndex {
  /**
   * The name of the index.
   */
  name: string;

  /**
   * The fields of the index.
   */
  fields: SearchField[];

  /**
   * The scoring profiles for the index.
   */
  scoringProfiles?: ScoringProfile[];

  /**
   * The name of the scoring profile to use if none is specified in the query. If
   * this property is not set and no scoring profile is specified in the query, then
   * default scoring (tf-idf) will be used.
   */
  defaultScoringProfile?: string;

  /**
   * Options to control Cross-Origin Resource Sharing (CORS) for the index.
   */
  corsOptions?: CorsOptions;

  /**
   * The suggesters for the index.
   */
  suggesters?: SearchSuggester[];

  /**
   * The analyzers for the index.
   */
  analyzers?: LexicalAnalyzer[];

  /**
   * The tokenizers for the index.
   */
  tokenizers?: LexicalTokenizer[];

  /**
   * The token filters for the index.
   */
  tokenFilters?: TokenFilter[];

  /**
   * The character filters for the index.
   */
  charFilters?: CharFilter[];

  /**
   * The normalizers for the index.
   */
  @added(Versions.v2024_11_01_preview)
  normalizers?: LexicalNormalizer[];

  /**
   * A description of an encryption key that you create in Azure Key Vault. This key
   * is used to provide an additional level of encryption-at-rest for your data when
   * you want full assurance that no one, not even Microsoft, can decrypt your data.
   * Once you have encrypted your data, it will always remain encrypted. The search
   * service will ignore attempts to set this property to null. You can change this
   * property as needed if you want to rotate your encryption key; Your data will be
   * unaffected. Encryption with customer-managed keys is not available for free
   * search services, and is only available for paid services created on or after
   * January 1, 2019.
   */
  encryptionKey?: SearchResourceEncryptionKey;

  /**
   * The type of similarity algorithm to be used when scoring and ranking the
   * documents matching a search query. The similarity algorithm can only be defined
   * at index creation time and cannot be modified on existing indexes. If null, the
   * ClassicSimilarity algorithm is used.
   */
  similarity?: SimilarityAlgorithm;

  /**
   * Defines parameters for a search index that influence semantic capabilities.
   */
  semantic?: SemanticSearch;

  /**
   * Contains configuration options related to vector search.
   */
  vectorSearch?: VectorSearch;

  /**
   * The ETag of the index.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;
}

/**
 * Represents a field in an index definition, which describes the name, data type,
 * and search behavior of a field.
 */
model SearchField {
  /**
   * The name of the field, which must be unique within the fields collection of the
   * index or parent field.
   */
  name: string;

  /**
   * The data type of the field.
   */
  type: SearchFieldDataType;

  /**
   * A value indicating whether the field uniquely identifies documents in the
   * index. Exactly one top-level field in each index must be chosen as the key
   * field and it must be of type Edm.String. Key fields can be used to look up
   * documents directly and update or delete specific documents. Default is false
   * for simple fields and null for complex fields.
   */
  key?: boolean;

  /**
   * A value indicating whether the field can be returned in a search result. You
   * can disable this option if you want to use a field (for example, margin) as a
   * filter, sorting, or scoring mechanism but do not want the field to be visible
   * to the end user. This property must be true for key fields, and it must be null
   * for complex fields. This property can be changed on existing fields. Enabling
   * this property does not cause any increase in index storage requirements.
   * Default is true for simple fields, false for vector fields, and null for
   * complex fields.
   */
  retrievable?: boolean;

  /**
   * An immutable value indicating whether the field will be persisted separately on
   * disk to be returned in a search result. You can disable this option if you
   * don't plan to return the field contents in a search response to save on storage
   * overhead. This can only be set during index creation and only for vector
   * fields. This property cannot be changed for existing fields or set as false for
   * new fields. If this property is set as false, the property 'retrievable' must
   * also be set to false. This property must be true or unset for key fields, for
   * new fields, and for non-vector fields, and it must be null for complex fields.
   * Disabling this property will reduce index storage requirements. The default is
   * true for vector fields.
   */
  stored?: boolean;

  /**
   * A value indicating whether the field is full-text searchable. This means it
   * will undergo analysis such as word-breaking during indexing. If you set a
   * searchable field to a value like "sunny day", internally it will be split into
   * the individual tokens "sunny" and "day". This enables full-text searches for
   * these terms. Fields of type Edm.String or Collection(Edm.String) are searchable
   * by default. This property must be false for simple fields of other non-string
   * data types, and it must be null for complex fields. Note: searchable fields
   * consume extra space in your index to accommodate additional tokenized versions
   * of the field value for full-text searches. If you want to save space in your
   * index and you don't need a field to be included in searches, set searchable to
   * false.
   */
  searchable?: boolean;

  /**
   * A value indicating whether to enable the field to be referenced in $filter
   * queries. filterable differs from searchable in how strings are handled. Fields
   * of type Edm.String or Collection(Edm.String) that are filterable do not undergo
   * word-breaking, so comparisons are for exact matches only. For example, if you
   * set such a field f to "sunny day", $filter=f eq 'sunny' will find no matches,
   * but $filter=f eq 'sunny day' will. This property must be null for complex
   * fields. Default is true for simple fields and null for complex fields.
   */
  filterable?: boolean;

  /**
   * A value indicating whether to enable the field to be referenced in $orderby
   * expressions. By default, the search engine sorts results by score, but in many
   * experiences users will want to sort by fields in the documents. A simple field
   * can be sortable only if it is single-valued (it has a single value in the scope
   * of the parent document). Simple collection fields cannot be sortable, since
   * they are multi-valued. Simple sub-fields of complex collections are also
   * multi-valued, and therefore cannot be sortable. This is true whether it's an
   * immediate parent field, or an ancestor field, that's the complex collection.
   * Complex fields cannot be sortable and the sortable property must be null for
   * such fields. The default for sortable is true for single-valued simple fields,
   * false for multi-valued simple fields, and null for complex fields.
   */
  sortable?: boolean;

  /**
   * A value indicating whether to enable the field to be referenced in facet
   * queries. Typically used in a presentation of search results that includes hit
   * count by category (for example, search for digital cameras and see hits by
   * brand, by megapixels, by price, and so on). This property must be null for
   * complex fields. Fields of type Edm.GeographyPoint or
   * Collection(Edm.GeographyPoint) cannot be facetable. Default is true for all
   * other simple fields.
   */
  facetable?: boolean;

  /**
   * The name of the analyzer to use for the field. This option can be used only
   * with searchable fields and it can't be set together with either searchAnalyzer
   * or indexAnalyzer. Once the analyzer is chosen, it cannot be changed for the
   * field. Must be null for complex fields.
   */
  analyzer?: LexicalAnalyzerName;

  /**
   * The name of the analyzer used at search time for the field. This option can be
   * used only with searchable fields. It must be set together with indexAnalyzer
   * and it cannot be set together with the analyzer option. This property cannot be
   * set to the name of a language analyzer; use the analyzer property instead if
   * you need a language analyzer. This analyzer can be updated on an existing
   * field. Must be null for complex fields.
   */
  searchAnalyzer?: LexicalAnalyzerName;

  /**
   * The name of the analyzer used at indexing time for the field. This option can
   * be used only with searchable fields. It must be set together with
   * searchAnalyzer and it cannot be set together with the analyzer option.  This
   * property cannot be set to the name of a language analyzer; use the analyzer
   * property instead if you need a language analyzer. Once the analyzer is chosen,
   * it cannot be changed for the field. Must be null for complex fields.
   */
  indexAnalyzer?: LexicalAnalyzerName;

  /**
   * The name of the normalizer to use for the field. This option can be used only
   * with fields with filterable, sortable, or facetable enabled. Once the
   * normalizer is chosen, it cannot be changed for the field. Must be null for
   * complex fields.
   */
  @added(Versions.v2024_11_01_preview)
  normalizer?: LexicalNormalizerName;

  /**
   * The dimensionality of the vector field.
   */
  @maxValue(2048)
  @minValue(2)
  dimensions?: int32;

  /**
   * The name of the vector search profile that specifies the algorithm and
   * vectorizer to use when searching the vector field.
   */
  vectorSearchProfile?: string;

  /**
   * The encoding format to interpret the field contents.
   */
  vectorEncoding?: VectorEncodingFormat;

  /**
   * A list of the names of synonym maps to associate with this field. This option
   * can be used only with searchable fields. Currently only one synonym map per
   * field is supported. Assigning a synonym map to a field ensures that query terms
   * targeting that field are expanded at query-time using the rules in the synonym
   * map. This attribute can be changed on existing fields. Must be null or an empty
   * collection for complex fields.
   */
  synonymMaps?: string[];

  /**
   * A list of sub-fields if this is a field of type Edm.ComplexType or
   * Collection(Edm.ComplexType). Must be null or empty for simple fields.
   */
  fields?: SearchField[];
}

/**
 * Defines parameters for a search index that influence scoring in search queries.
 */
model ScoringProfile {
  /**
   * The name of the scoring profile.
   */
  name: string;

  /**
   * Parameters that boost scoring based on text matches in certain index fields.
   */
  text?: TextWeights;

  /**
   * The collection of functions that influence the scoring of documents.
   */
  functions?: ScoringFunction[];

  /**
   * A value indicating how the results of individual scoring functions should be
   * combined. Defaults to "Sum". Ignored if there are no scoring functions.
   */
  functionAggregation?: ScoringFunctionAggregation;
}

/**
 * Defines weights on index fields for which matches should boost scoring in
 * search queries.
 */
model TextWeights {
  /**
   * The dictionary of per-field weights to boost document scoring. The keys are
   * field names and the values are the weights for each field.
   */
  weights: Record<float64>;
}

/**
 * Base type for functions that can modify document scores during ranking.
 */
#suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
@discriminator("type")
model ScoringFunction {
  /**
   * The name of the field used as input to the scoring function.
   */
  fieldName: string;

  /**
   * A multiplier for the raw score. Must be a positive number not equal to 1.0.
   */
  boost: float64;

  /**
   * A value indicating how boosting will be interpolated across document scores;
   * defaults to "Linear".
   */
  interpolation?: ScoringFunctionInterpolation;

  @doc("Type of ScoringFunction.")
  type: string;
}

/**
 * Defines options to control Cross-Origin Resource Sharing (CORS) for an index.
 */
model CorsOptions {
  /**
   * The list of origins from which JavaScript code will be granted access to your
   * index. Can contain a list of hosts of the form
   * {protocol}://{fully-qualified-domain-name}[:{port#}], or a single '*' to allow
   * all origins (not recommended).
   */
  allowedOrigins: string[];

  /**
   * The duration for which browsers should cache CORS preflight responses. Defaults
   * to 5 minutes.
   */
  maxAgeInSeconds?: int64;
}

/**
 * Defines how the Suggest API should apply to a group of fields in the index.
 */
model SearchSuggester {
  /**
   * The name of the suggester.
   */
  name: string;

  /**
   * A value indicating the capabilities of the suggester.
   */
  searchMode: "analyzingInfixMatching";

  /**
   * The list of field names to which the suggester applies. Each field must be
   * searchable.
   */
  sourceFields: string[];
}

/**
 * Base type for analyzers.
 */
@discriminator("@odata.type")
model LexicalAnalyzer {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the analyzer. It must only contain letters, digits, spaces, dashes
   * or underscores, can only start and end with alphanumeric characters, and is
   * limited to 128 characters.
   */
  name: string;
}

/**
 * Base type for tokenizers.
 */
@discriminator("@odata.type")
model LexicalTokenizer {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the tokenizer. It must only contain letters, digits, spaces, dashes
   * or underscores, can only start and end with alphanumeric characters, and is
   * limited to 128 characters.
   */
  name: string;
}

/**
 * Base type for token filters.
 */
@discriminator("@odata.type")
model TokenFilter {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the token filter. It must only contain letters, digits, spaces,
   * dashes or underscores, can only start and end with alphanumeric characters, and
   * is limited to 128 characters.
   */
  name: string;
}

/**
 * Base type for character filters.
 */
@discriminator("@odata.type")
model CharFilter {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the char filter. It must only contain letters, digits, spaces,
   * dashes or underscores, can only start and end with alphanumeric characters, and
   * is limited to 128 characters.
   */
  name: string;
}

/**
 * Base type for normalizers.
 */
@added(Versions.v2024_11_01_preview)
@discriminator("@odata.type")
model LexicalNormalizer {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;

  /**
   * The name of the char filter. It must only contain letters, digits, spaces,
   * dashes or underscores, can only start and end with alphanumeric characters, and
   * is limited to 128 characters.
   */
  name: string;
}

/**
 * Base type for similarity algorithms. Similarity algorithms are used to
 * calculate scores that tie queries to documents. The higher the score, the more
 * relevant the document is to that specific query. Those scores are used to rank
 * the search results.
 */
@discriminator("@odata.type")
model SimilarityAlgorithm {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;
}

/**
 * Defines parameters for a search index that influence semantic capabilities.
 */
model SemanticSearch {
  /**
   * Allows you to set the name of a default semantic configuration in your index,
   * making it optional to pass it on as a query parameter every time.
   */
  defaultConfiguration?: string;

  /**
   * The semantic configurations for the index.
   */
  configurations?: SemanticConfiguration[];
}

/**
 * Defines a specific configuration to be used in the context of semantic
 * capabilities.
 */
model SemanticConfiguration {
  /**
   * The name of the semantic configuration.
   */
  name: string;

  /**
   * Describes the title, content, and keyword fields to be used for semantic
   * ranking, captions, highlights, and answers. At least one of the three sub
   * properties (titleField, prioritizedKeywordsFields and prioritizedContentFields)
   * need to be set.
   */
  prioritizedFields: SemanticPrioritizedFields;
}

/**
 * Describes the title, content, and keywords fields to be used for semantic
 * ranking, captions, highlights, and answers.
 */
model SemanticPrioritizedFields {
  /**
   * Defines the title field to be used for semantic ranking, captions, highlights,
   * and answers. If you don't have a title field in your index, leave this blank.
   */
  titleField?: SemanticField;

  /**
   * Defines the content fields to be used for semantic ranking, captions,
   * highlights, and answers. For the best result, the selected fields should
   * contain text in natural language form. The order of the fields in the array
   * represents their priority. Fields with lower priority may get truncated if the
   * content is long.
   */
  prioritizedContentFields?: SemanticField[];

  /**
   * Defines the keyword fields to be used for semantic ranking, captions,
   * highlights, and answers. For the best result, the selected fields should
   * contain a list of keywords. The order of the fields in the array represents
   * their priority. Fields with lower priority may get truncated if the content is
   * long.
   */
  prioritizedKeywordsFields?: SemanticField[];
}

/**
 * A field that is used as part of the semantic configuration.
 */
model SemanticField {
  /**
   * File name
   */
  fieldName: string;
}

/**
 * Contains configuration options related to vector search.
 */
model VectorSearch {
  /**
   * Defines combinations of configurations to use with vector search.
   */
  profiles?: VectorSearchProfile[];

  /**
   * Contains configuration options specific to the algorithm used during indexing
   * or querying.
   */
  algorithms?: VectorSearchAlgorithmConfiguration[];

  /**
   * Contains configuration options on how to vectorize text vector queries.
   */
  vectorizers?: VectorSearchVectorizer[];

  /**
   * Contains configuration options specific to the compression method used during
   * indexing or querying.
   */
  compressions?: VectorSearchCompression[];
}

/**
 * Defines a combination of configurations to use with vector search.
 */
model VectorSearchProfile {
  /**
   * The name to associate with this particular vector search profile.
   */
  name: string;

  /**
   * The name of the vector search algorithm configuration that specifies the
   * algorithm and optional parameters.
   */
  algorithm: string;

  /**
   * The name of the vectorization being configured for use with vector search.
   */
  vectorizer?: string;

  /**
   * The name of the compression method configuration that specifies the compression
   * method and optional parameters.
   */
  compression?: string;
}

/**
 * Contains configuration options specific to the algorithm used during indexing
 * or querying.
 */
@discriminator("kind")
model VectorSearchAlgorithmConfiguration {
  /**
   * The name to associate with this particular configuration.
   */
  name: string;

  @doc("Type of VectorSearchAlgorithmConfiguration.")
  kind: VectorSearchAlgorithmKind;
}

/**
 * Specifies the vectorization method to be used during query time.
 */
@discriminator("kind")
model VectorSearchVectorizer {
  /**
   * The name to associate with this particular vectorization method.
   */
  name: string;

  @doc("Type of VectorSearchVectorizer.")
  kind: VectorSearchVectorizerKind;
}

/**
 * Contains configuration options specific to the compression method used during
 * indexing or querying.
 */
@discriminator("kind")
model VectorSearchCompression {
  /**
   * The name to associate with this particular configuration.
   */
  name: string;

  /**
   * If set to true, once the ordered set of results calculated using compressed
   * vectors are obtained, they will be reranked again by recalculating the
   * full-precision similarity scores. This will improve recall at the expense of
   * latency.
   */
  rerankWithOriginalVectors?: boolean = true;

  /**
   * Default oversampling factor. Oversampling will internally request more
   * documents (specified by this multiplier) in the initial search. This increases
   * the set of results that will be reranked using recomputed similarity scores
   * from full-precision vectors. Minimum value is 1, meaning no oversampling (1x).
   * This parameter can only be set when rerankWithOriginalVectors is true. Higher
   * values improve recall at the expense of latency.
   */
  defaultOversampling?: float64;

  /**
   * Contains the options for rescoring.
   */
  @added(Versions.v2024_11_01_preview)
  rescoringOptions?: RescoringOptions;

  /**
   * The number of dimensions to truncate the vectors to. Truncating the vectors
   * reduces the size of the vectors and the amount of data that needs to be
   * transferred during search. This can save storage cost and improve search
   * performance at the expense of recall. It should be only used for embeddings
   * trained with Matryoshka Representation Learning (MRL) such as OpenAI
   * text-embedding-3-large (small). The default value is null, which means no
   * truncation.
   */
  @added(Versions.v2024_11_01_preview)
  truncationDimension?: int32;

  @doc("Type of VectorSearchCompression.")
  kind: VectorSearchCompressionKind;
}

/**
 * Contains the options for rescoring.
 */
@added(Versions.v2024_11_01_preview)
model RescoringOptions {
  /**
   * If set to true, after the initial search on the compressed vectors, the
   * similarity scores are recalculated using the full-precision vectors. This will
   * improve recall at the expense of latency.
   */
  enableRescoring?: boolean = true;

  /**
   * Default oversampling factor. Oversampling retrieves a greater set of potential
   * documents to offset the resolution loss due to quantization. This increases the
   * set of results that will be rescored on full-precision vectors. Minimum value
   * is 1, meaning no oversampling (1x). This parameter can only be set when 'enableRescoring'
   * is true. Higher values improve recall at the expense of latency.
   */
  defaultOversampling?: float64;

  /**
   * Controls the storage method for original vectors. This setting is immutable.
   */
  rescoreStorageMethod?: VectorSearchCompressionRescoreStorageMethod;
}

/**
 * Response from a List Indexes request. If successful, it includes the full
 * definitions of all indexes.
 */
@pagedResult
model ListIndexesResult {
  /**
   * The indexes in the Search service.
   */
  @visibility("read")
  @items
  value: SearchIndex[];
}

/**
 * Statistics for a given index. Statistics are collected periodically and are not
 * guaranteed to always be up-to-date.
 */
model GetIndexStatisticsResult {
  /**
   * The number of documents in the index.
   */
  @visibility("read")
  documentCount: int64;

  /**
   * The amount of storage in bytes consumed by the index.
   */
  @visibility("read")
  storageSize: int64;

  /**
   * The amount of memory in bytes consumed by vectors in the index.
   */
  @visibility("read")
  vectorIndexSize: int64;
}

/**
 * Specifies some text and analysis components used to break that text into tokens.
 */
model AnalyzeRequest {
  /**
   * The text to break into tokens.
   */
  text: string;

  /**
   * The name of the analyzer to use to break the given text. If this parameter is
   * not specified, you must specify a tokenizer instead. The tokenizer and analyzer
   * parameters are mutually exclusive.
   */
  analyzer?: LexicalAnalyzerName;

  /**
   * The name of the tokenizer to use to break the given text. If this parameter is
   * not specified, you must specify an analyzer instead. The tokenizer and analyzer
   * parameters are mutually exclusive.
   */
  tokenizer?: LexicalTokenizerName;

  /**
   * The name of the normalizer to use to normalize the given text.
   */
  @added(Versions.v2024_11_01_preview)
  normalizer?: LexicalNormalizerName;

  /**
   * An optional list of token filters to use when breaking the given text. This
   * parameter can only be set when using the tokenizer parameter.
   */
  tokenFilters?: TokenFilterName[];

  /**
   * An optional list of character filters to use when breaking the given text. This
   * parameter can only be set when using the tokenizer parameter.
   */
  charFilters?: CharFilterName[];
}

/**
 * The result of testing an analyzer on text.
 */
model AnalyzeResult {
  /**
   * The list of tokens returned by the analyzer specified in the request.
   */
  tokens: AnalyzedTokenInfo[];
}

/**
 * Information about a token returned by an analyzer.
 */
model AnalyzedTokenInfo {
  /**
   * The token returned by the analyzer.
   */
  @visibility("read")
  token: string;

  /**
   * The index of the first character of the token in the input text.
   */
  @visibility("read")
  startOffset: int32;

  /**
   * The index of the last character of the token in the input text.
   */
  @visibility("read")
  endOffset: int32;

  /**
   * The position of the token in the input text relative to other tokens. The first
   * token in the input text has position 0, the next has position 1, and so on.
   * Depending on the analyzer used, some tokens might have the same position, for
   * example if they are synonyms of each other.
   */
  @visibility("read")
  position: int32;
}

/**
 * Represents an index alias, which describes a mapping from the alias name to an
 * index. The alias name can be used in place of the index name for supported
 * operations.
 */
@added(Versions.v2024_11_01_preview)
model SearchAlias {
  /**
   * The name of the alias.
   */
  name: string;

  /**
   * The name of the index this alias maps to. Only one index name may be specified.
   */
  indexes: string[];

  /**
   * The ETag of the alias.
   */
  @encodedName("application/json", "@odata.etag")
  eTag?: string;
}

/**
 * Response from a List Aliases request. If successful, it includes the associated
 * index mappings for all aliases.
 */
@added(Versions.v2024_11_01_preview)
@pagedResult
model ListAliasesResult {
  /**
   * The aliases in the Search service.
   */
  @visibility("read")
  @items
  value: SearchAlias[];
}

/**
 * Response from a get service statistics request. If successful, it includes
 * service level counters and limits.
 */
model SearchServiceStatistics {
  /**
   * Service level resource counters.
   */
  counters: SearchServiceCounters;

  /**
   * Service level general limits.
   */
  limits: SearchServiceLimits;
}

/**
 * Represents service-level resource counters and quotas.
 */
model SearchServiceCounters {
  /**
   * Total number of aliases.
   */
  @added(Versions.v2024_11_01_preview)
  aliasesCount: ResourceCounter;

  /**
   * Total number of documents across all indexes in the service.
   */
  documentCount: ResourceCounter;

  /**
   * Total number of indexes.
   */
  indexesCount: ResourceCounter;

  /**
   * Total number of indexers.
   */
  indexersCount: ResourceCounter;

  /**
   * Total number of data sources.
   */
  dataSourcesCount: ResourceCounter;

  /**
   * Total size of used storage in bytes.
   */
  storageSize: ResourceCounter;

  /**
   * Total number of synonym maps.
   */
  synonymMaps: ResourceCounter;

  /**
   * Total number of skillsets.
   */
  skillsetCount: ResourceCounter;

  /**
   * Total memory consumption of all vector indexes within the service, in bytes.
   */
  vectorIndexSize: ResourceCounter;
}

/**
 * Represents a resource's usage and quota.
 */
model ResourceCounter {
  /**
   * The resource usage amount.
   */
  usage: int64;

  /**
   * The resource amount quota.
   */
  quota?: int64;
}

/**
 * Represents various service level limits.
 */
model SearchServiceLimits {
  /**
   * The maximum allowed fields per index.
   */
  maxFieldsPerIndex?: int32;

  /**
   * The maximum depth which you can nest sub-fields in an index, including the
   * top-level complex field. For example, a/b/c has a nesting depth of 3.
   */
  maxFieldNestingDepthPerIndex?: int32;

  /**
   * The maximum number of fields of type Collection(Edm.ComplexType) allowed in an
   * index.
   */
  maxComplexCollectionFieldsPerIndex?: int32;

  /**
   * The maximum number of objects in complex collections allowed per document.
   */
  maxComplexObjectsInCollectionsPerDocument?: int32;

  /**
   * The maximum amount of storage in bytes allowed per index.
   */
  maxStoragePerIndex?: int64;
}

/**
 * Allows you to take control over the process of converting text into
 * indexable/searchable tokens. It's a user-defined configuration consisting of a
 * single predefined tokenizer and one or more filters. The tokenizer is
 * responsible for breaking text into tokens, and the filters for modifying tokens
 * emitted by the tokenizer.
 */
model CustomAnalyzer extends LexicalAnalyzer {
  /**
   * The name of the tokenizer to use to divide continuous text into a sequence of
   * tokens, such as breaking a sentence into words.
   */
  tokenizer: LexicalTokenizerName;

  /**
   * A list of token filters used to filter out or modify the tokens generated by a
   * tokenizer. For example, you can specify a lowercase filter that converts all
   * characters to lowercase. The filters are run in the order in which they are
   * listed.
   */
  tokenFilters?: TokenFilterName[];

  /**
   * A list of character filters used to prepare input text before it is processed
   * by the tokenizer. For instance, they can replace certain characters or symbols.
   * The filters are run in the order in which they are listed.
   */
  charFilters?: CharFilterName[];

  /**
   * A URI fragment specifying the type of analyzer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.CustomAnalyzer";
}

/**
 * Flexibly separates text into terms via a regular expression pattern. This
 * analyzer is implemented using Apache Lucene.
 */
model PatternAnalyzer extends LexicalAnalyzer {
  /**
   * A value indicating whether terms should be lower-cased. Default is true.
   */
  lowercase?: boolean = true;

  /**
   * A regular expression pattern to match token separators. Default is an
   * expression that matches one or more non-word characters.
   */
  pattern?: string = "\\W+";

  /**
   * Regular expression flags.
   */
  flags?: RegexFlags;

  /**
   * A list of stopwords.
   */
  stopwords?: string[];

  /**
   * A URI fragment specifying the type of analyzer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PatternAnalyzer";
}

/**
 * Standard Apache Lucene analyzer; Composed of the standard tokenizer, lowercase
 * filter and stop filter.
 */
model LuceneStandardAnalyzer extends LexicalAnalyzer {
  /**
   * The maximum token length. Default is 255. Tokens longer than the maximum length
   * are split. The maximum token length that can be used is 300 characters.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A list of stopwords.
   */
  stopwords?: string[];

  /**
   * A URI fragment specifying the type of analyzer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StandardAnalyzer";
}

/**
 * Divides text at non-letters; Applies the lowercase and stopword token filters.
 * This analyzer is implemented using Apache Lucene.
 */
model StopAnalyzer extends LexicalAnalyzer {
  /**
   * A list of stopwords.
   */
  stopwords?: string[];

  /**
   * A URI fragment specifying the type of analyzer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StopAnalyzer";
}

/**
 * Allows you to configure normalization for filterable, sortable, and facetable
 * fields, which by default operate with strict matching. This is a user-defined
 * configuration consisting of at least one or more filters, which modify the
 * token that is stored.
 */
@added(Versions.v2024_11_01_preview)
model CustomNormalizer extends LexicalNormalizer {
  /**
   * A list of token filters used to filter out or modify the input token. For
   * example, you can specify a lowercase filter that converts all characters to
   * lowercase. The filters are run in the order in which they are listed.
   */
  tokenFilters?: TokenFilterName[];

  /**
   * A list of character filters used to prepare input text before it is processed.
   * For instance, they can replace certain characters or symbols. The filters are
   * run in the order in which they are listed.
   */
  charFilters?: CharFilterName[];

  /**
   * A URI fragment specifying the type of normalizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.CustomNormalizer";
}

/**
 * Grammar-based tokenizer that is suitable for processing most European-language
 * documents. This tokenizer is implemented using Apache Lucene.
 */
model ClassicTokenizer extends LexicalTokenizer {
  /**
   * The maximum token length. Default is 255. Tokens longer than the maximum length
   * are split. The maximum token length that can be used is 300 characters.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.ClassicTokenizer";
}

/**
 * Tokenizes the input from an edge into n-grams of the given size(s). This
 * tokenizer is implemented using Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model EdgeNGramTokenizer extends LexicalTokenizer {
  /**
   * The minimum n-gram length. Default is 1. Maximum is 300. Must be less than the
   * value of maxGram.
   */
  @maxValue(300)
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2. Maximum is 300.
   */
  @maxValue(300)
  maxGram?: int32 = 2;

  /**
   * Character classes to keep in the tokens.
   */
  tokenChars?: TokenCharacterKind[];

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.EdgeNGramTokenizer";
}

/**
 * Emits the entire input as a single token. This tokenizer is implemented using
 * Apache Lucene.
 */
model KeywordTokenizer extends LexicalTokenizer {
  /**
   * The read buffer size in bytes. Default is 256.
   */
  bufferSize?: int32 = 256;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.KeywordTokenizer";
}

/**
 * Emits the entire input as a single token. This tokenizer is implemented using
 * Apache Lucene.
 */
model KeywordTokenizerV2 extends LexicalTokenizer {
  /**
   * The maximum token length. Default is 256. Tokens longer than the maximum length
   * are split. The maximum token length that can be used is 300 characters.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 256;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.KeywordTokenizerV2";
}

/**
 * Divides text using language-specific rules.
 */
model MicrosoftLanguageTokenizer extends LexicalTokenizer {
  /**
   * The maximum token length. Tokens longer than the maximum length are split.
   * Maximum token length that can be used is 300 characters. Tokens longer than 300
   * characters are first split into tokens of length 300 and then each of those
   * tokens is split based on the max token length set. Default is 255.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A value indicating how the tokenizer is used. Set to true if used as the search
   * tokenizer, set to false if used as the indexing tokenizer. Default is false.
   */
  isSearchTokenizer?: boolean;

  /**
   * The language to use. The default is English.
   */
  language?: MicrosoftTokenizerLanguage;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.MicrosoftLanguageTokenizer";
}

/**
 * Divides text using language-specific rules and reduces words to their base
 * forms.
 */
model MicrosoftLanguageStemmingTokenizer extends LexicalTokenizer {
  /**
   * The maximum token length. Tokens longer than the maximum length are split.
   * Maximum token length that can be used is 300 characters. Tokens longer than 300
   * characters are first split into tokens of length 300 and then each of those
   * tokens is split based on the max token length set. Default is 255.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A value indicating how the tokenizer is used. Set to true if used as the search
   * tokenizer, set to false if used as the indexing tokenizer. Default is false.
   */
  isSearchTokenizer?: boolean;

  /**
   * The language to use. The default is English.
   */
  language?: MicrosoftStemmingTokenizerLanguage;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.MicrosoftLanguageStemmingTokenizer";
}

/**
 * Tokenizes the input into n-grams of the given size(s). This tokenizer is
 * implemented using Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model NGramTokenizer extends LexicalTokenizer {
  /**
   * The minimum n-gram length. Default is 1. Maximum is 300. Must be less than the
   * value of maxGram.
   */
  @maxValue(300)
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2. Maximum is 300.
   */
  @maxValue(300)
  maxGram?: int32 = 2;

  /**
   * Character classes to keep in the tokens.
   */
  tokenChars?: TokenCharacterKind[];

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.NGramTokenizer";
}

/**
 * Tokenizer for path-like hierarchies. This tokenizer is implemented using Apache
 * Lucene.
 */
model PathHierarchyTokenizerV2 extends LexicalTokenizer {
  /**
   * The delimiter character to use. Default is "/".
   */
  delimiter?: string = "/";

  /**
   * A value that, if set, replaces the delimiter character. Default is "/".
   */
  replacement?: string = "/";

  /**
   * The maximum token length. Default and maximum is 300.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 300;

  /**
   * A value indicating whether to generate tokens in reverse order. Default is
   * false.
   */
  reverse?: boolean;

  /**
   * The number of initial tokens to skip. Default is 0.
   */
  skip?: int32;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PathHierarchyTokenizerV2";
}

/**
 * Tokenizer that uses regex pattern matching to construct distinct tokens. This
 * tokenizer is implemented using Apache Lucene.
 */
model PatternTokenizer extends LexicalTokenizer {
  /**
   * A regular expression pattern to match token separators. Default is an
   * expression that matches one or more non-word characters.
   */
  pattern?: string = "\\W+";

  /**
   * Regular expression flags.
   */
  flags?: RegexFlags;

  /**
   * The zero-based ordinal of the matching group in the regular expression pattern
   * to extract into tokens. Use -1 if you want to use the entire pattern to split
   * the input into tokens, irrespective of matching groups. Default is -1.
   */
  group?: int32 = -1;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PatternTokenizer";
}

/**
 * Breaks text following the Unicode Text Segmentation rules. This tokenizer is
 * implemented using Apache Lucene.
 */
model LuceneStandardTokenizer extends LexicalTokenizer {
  /**
   * The maximum token length. Default is 255. Tokens longer than the maximum length
   * are split.
   */
  maxTokenLength?: int32 = 255;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StandardTokenizer";
}

/**
 * Breaks text following the Unicode Text Segmentation rules. This tokenizer is
 * implemented using Apache Lucene.
 */
model LuceneStandardTokenizerV2 extends LexicalTokenizer {
  /**
   * The maximum token length. Default is 255. Tokens longer than the maximum length
   * are split. The maximum token length that can be used is 300 characters.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StandardTokenizerV2";
}

/**
 * Tokenizes urls and emails as one token. This tokenizer is implemented using
 * Apache Lucene.
 */
model UaxUrlEmailTokenizer extends LexicalTokenizer {
  /**
   * The maximum token length. Default is 255. Tokens longer than the maximum length
   * are split. The maximum token length that can be used is 300 characters.
   */
  @maxValue(300)
  maxTokenLength?: int32 = 255;

  /**
   * A URI fragment specifying the type of tokenizer.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.UaxUrlEmailTokenizer";
}

/**
 * Converts alphabetic, numeric, and symbolic Unicode characters which are not in
 * the first 127 ASCII characters (the "Basic Latin" Unicode block) into their
 * ASCII equivalents, if such equivalents exist. This token filter is implemented
 * using Apache Lucene.
 */
model AsciiFoldingTokenFilter extends TokenFilter {
  /**
   * A value indicating whether the original token will be kept. Default is false.
   */
  preserveOriginal?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.AsciiFoldingTokenFilter";
}

/**
 * Forms bigrams of CJK terms that are generated from the standard tokenizer. This
 * token filter is implemented using Apache Lucene.
 */
model CjkBigramTokenFilter extends TokenFilter {
  /**
   * The scripts to ignore.
   */
  ignoreScripts?: CjkBigramTokenFilterScripts[];

  /**
   * A value indicating whether to output both unigrams and bigrams (if true), or
   * just bigrams (if false). Default is false.
   */
  outputUnigrams?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.CjkBigramTokenFilter";
}

/**
 * Construct bigrams for frequently occurring terms while indexing. Single terms
 * are still indexed too, with bigrams overlaid. This token filter is implemented
 * using Apache Lucene.
 */
model CommonGramTokenFilter extends TokenFilter {
  /**
   * The set of common words.
   */
  commonWords: string[];

  /**
   * A value indicating whether common words matching will be case insensitive.
   * Default is false.
   */
  ignoreCase?: boolean;

  /**
   * A value that indicates whether the token filter is in query mode. When in query
   * mode, the token filter generates bigrams and then removes common words and
   * single terms followed by a common word. Default is false.
   */
  queryMode?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.CommonGramTokenFilter";
}

/**
 * Decomposes compound words found in many Germanic languages. This token filter
 * is implemented using Apache Lucene.
 */
model DictionaryDecompounderTokenFilter extends TokenFilter {
  /**
   * The list of words to match against.
   */
  wordList: string[];

  /**
   * The minimum word size. Only words longer than this get processed. Default is 5.
   * Maximum is 300.
   */
  @maxValue(300)
  minWordSize?: int32 = 5;

  /**
   * The minimum subword size. Only subwords longer than this are outputted. Default
   * is 2. Maximum is 300.
   */
  @maxValue(300)
  minSubwordSize?: int32 = 2;

  /**
   * The maximum subword size. Only subwords shorter than this are outputted.
   * Default is 15. Maximum is 300.
   */
  @maxValue(300)
  maxSubwordSize?: int32 = 15;

  /**
   * A value indicating whether to add only the longest matching subword to the
   * output. Default is false.
   */
  onlyLongestMatch?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.DictionaryDecompounderTokenFilter";
}

/**
 * Generates n-grams of the given size(s) starting from the front or the back of
 * an input token. This token filter is implemented using Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model EdgeNGramTokenFilter extends TokenFilter {
  /**
   * The minimum n-gram length. Default is 1. Must be less than the value of maxGram.
   */
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2.
   */
  maxGram?: int32 = 2;

  /**
   * Specifies which side of the input the n-gram should be generated from. Default
   * is "front".
   */
  side?: EdgeNGramTokenFilterSide;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.EdgeNGramTokenFilter";
}

/**
 * Generates n-grams of the given size(s) starting from the front or the back of
 * an input token. This token filter is implemented using Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model EdgeNGramTokenFilterV2 extends TokenFilter {
  /**
   * The minimum n-gram length. Default is 1. Maximum is 300. Must be less than the
   * value of maxGram.
   */
  @maxValue(300)
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2. Maximum is 300.
   */
  @maxValue(300)
  maxGram?: int32 = 2;

  /**
   * Specifies which side of the input the n-gram should be generated from. Default
   * is "front".
   */
  side?: EdgeNGramTokenFilterSide;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.EdgeNGramTokenFilterV2";
}

/**
 * Removes elisions. For example, "l'avion" (the plane) will be converted to
 * "avion" (plane). This token filter is implemented using Apache Lucene.
 */
model ElisionTokenFilter extends TokenFilter {
  /**
   * The set of articles to remove.
   */
  articles?: string[];

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.ElisionTokenFilter";
}

/**
 * A token filter that only keeps tokens with text contained in a specified list
 * of words. This token filter is implemented using Apache Lucene.
 */
model KeepTokenFilter extends TokenFilter {
  /**
   * The list of words to keep.
   */
  keepWords: string[];

  /**
   * A value indicating whether to lower case all words first. Default is false.
   */
  keepWordsCase?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.KeepTokenFilter";
}

/**
 * Marks terms as keywords. This token filter is implemented using Apache Lucene.
 */
model KeywordMarkerTokenFilter extends TokenFilter {
  /**
   * A list of words to mark as keywords.
   */
  keywords: string[];

  /**
   * A value indicating whether to ignore case. If true, all words are converted to
   * lower case first. Default is false.
   */
  ignoreCase?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.KeywordMarkerTokenFilter";
}

/**
 * Removes words that are too long or too short. This token filter is implemented
 * using Apache Lucene.
 */
model LengthTokenFilter extends TokenFilter {
  /**
   * The minimum length in characters. Default is 0. Maximum is 300. Must be less
   * than the value of max.
   */
  @maxValue(300)
  min?: int32;

  /**
   * The maximum length in characters. Default and maximum is 300.
   */
  @maxValue(300)
  max?: int32 = 300;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.LengthTokenFilter";
}

/**
 * Limits the number of tokens while indexing. This token filter is implemented
 * using Apache Lucene.
 */
model LimitTokenFilter extends TokenFilter {
  /**
   * The maximum number of tokens to produce. Default is 1.
   */
  maxTokenCount?: int32 = 1;

  /**
   * A value indicating whether all tokens from the input must be consumed even if
   * maxTokenCount is reached. Default is false.
   */
  consumeAllTokens?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.LimitTokenFilter";
}

/**
 * Generates n-grams of the given size(s). This token filter is implemented using
 * Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model NGramTokenFilter extends TokenFilter {
  /**
   * The minimum n-gram length. Default is 1. Must be less than the value of maxGram.
   */
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2.
   */
  maxGram?: int32 = 2;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.NGramTokenFilter";
}

/**
 * Generates n-grams of the given size(s). This token filter is implemented using
 * Apache Lucene.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model NGramTokenFilterV2 extends TokenFilter {
  /**
   * The minimum n-gram length. Default is 1. Maximum is 300. Must be less than the
   * value of maxGram.
   */
  @maxValue(300)
  minGram?: int32 = 1;

  /**
   * The maximum n-gram length. Default is 2. Maximum is 300.
   */
  @maxValue(300)
  maxGram?: int32 = 2;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.NGramTokenFilterV2";
}

/**
 * Uses Java regexes to emit multiple tokens - one for each capture group in one
 * or more patterns. This token filter is implemented using Apache Lucene.
 */
model PatternCaptureTokenFilter extends TokenFilter {
  /**
   * A list of patterns to match against each token.
   */
  patterns: string[];

  /**
   * A value indicating whether to return the original token even if one of the
   * patterns matches. Default is true.
   */
  preserveOriginal?: boolean = true;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PatternCaptureTokenFilter";
}

/**
 * A character filter that replaces characters in the input string. It uses a
 * regular expression to identify character sequences to preserve and a
 * replacement pattern to identify characters to replace. For example, given the
 * input text "aa bb aa bb", pattern "(aa)\s+(bb)", and replacement "$1#$2", the
 * result would be "aa#bb aa#bb". This token filter is implemented using Apache
 * Lucene.
 */
model PatternReplaceTokenFilter extends TokenFilter {
  /**
   * A regular expression pattern.
   */
  pattern: string;

  /**
   * The replacement text.
   */
  replacement: string;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PatternReplaceTokenFilter";
}

/**
 * Create tokens for phonetic matches. This token filter is implemented using
 * Apache Lucene.
 */
model PhoneticTokenFilter extends TokenFilter {
  /**
   * The phonetic encoder to use. Default is "metaphone".
   */
  encoder?: PhoneticEncoder;

  /**
   * A value indicating whether encoded tokens should replace original tokens. If
   * false, encoded tokens are added as synonyms. Default is true.
   */
  replace?: boolean = true;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PhoneticTokenFilter";
}

/**
 * Creates combinations of tokens as a single token. This token filter is
 * implemented using Apache Lucene.
 */
model ShingleTokenFilter extends TokenFilter {
  /**
   * The maximum shingle size. Default and minimum value is 2.
   */
  @minValue(2)
  maxShingleSize?: int32 = 2;

  /**
   * The minimum shingle size. Default and minimum value is 2. Must be less than the
   * value of maxShingleSize.
   */
  @minValue(2)
  minShingleSize?: int32 = 2;

  /**
   * A value indicating whether the output stream will contain the input tokens
   * (unigrams) as well as shingles. Default is true.
   */
  outputUnigrams?: boolean = true;

  /**
   * A value indicating whether to output unigrams for those times when no shingles
   * are available. This property takes precedence when outputUnigrams is set to
   * false. Default is false.
   */
  outputUnigramsIfNoShingles?: boolean;

  /**
   * The string to use when joining adjacent tokens to form a shingle. Default is a
   * single space (" ").
   */
  tokenSeparator?: string = " ";

  /**
   * The string to insert for each position at which there is no token. Default is
   * an underscore ("_").
   */
  filterToken?: string = "_";

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.ShingleTokenFilter";
}

/**
 * A filter that stems words using a Snowball-generated stemmer. This token filter
 * is implemented using Apache Lucene.
 */
model SnowballTokenFilter extends TokenFilter {
  /**
   * The language to use.
   */
  language: SnowballTokenFilterLanguage;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.SnowballTokenFilter";
}

/**
 * Language specific stemming filter. This token filter is implemented using
 * Apache Lucene.
 */
model StemmerTokenFilter extends TokenFilter {
  /**
   * The language to use.
   */
  language: StemmerTokenFilterLanguage;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StemmerTokenFilter";
}

/**
 * Provides the ability to override other stemming filters with custom
 * dictionary-based stemming. Any dictionary-stemmed terms will be marked as
 * keywords so that they will not be stemmed with stemmers down the chain. Must be
 * placed before any stemming filters. This token filter is implemented using
 * Apache Lucene.
 */
model StemmerOverrideTokenFilter extends TokenFilter {
  /**
   * A list of stemming rules in the following format: "word => stem", for example:
   * "ran => run".
   */
  rules: string[];

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StemmerOverrideTokenFilter";
}

/**
 * Removes stop words from a token stream. This token filter is implemented using
 * Apache Lucene.
 */
model StopwordsTokenFilter extends TokenFilter {
  /**
   * The list of stopwords. This property and the stopwords list property cannot
   * both be set.
   */
  stopwords?: string[];

  /**
   * A predefined list of stopwords to use. This property and the stopwords property
   * cannot both be set. Default is English.
   */
  stopwordsList?: StopwordsList;

  /**
   * A value indicating whether to ignore case. If true, all words are converted to
   * lower case first. Default is false.
   */
  ignoreCase?: boolean;

  /**
   * A value indicating whether to ignore the last search term if it's a stop word.
   * Default is true.
   */
  removeTrailing?: boolean = true;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.StopwordsTokenFilter";
}

/**
 * Matches single or multi-word synonyms in a token stream. This token filter is
 * implemented using Apache Lucene.
 */
model SynonymTokenFilter extends TokenFilter {
  /**
   * A list of synonyms in following one of two formats: 1. incredible,
   * unbelievable, fabulous => amazing - all terms on the left side of => symbol
   * will be replaced with all terms on its right side; 2. incredible, unbelievable,
   * fabulous, amazing - comma separated list of equivalent words. Set the expand
   * option to change how this list is interpreted.
   */
  synonyms: string[];

  /**
   * A value indicating whether to case-fold input for matching. Default is false.
   */
  ignoreCase?: boolean;

  /**
   * A value indicating whether all words in the list of synonyms (if => notation is
   * not used) will map to one another. If true, all words in the list of synonyms
   * (if => notation is not used) will map to one another. The following list:
   * incredible, unbelievable, fabulous, amazing is equivalent to: incredible,
   * unbelievable, fabulous, amazing => incredible, unbelievable, fabulous, amazing.
   * If false, the following list: incredible, unbelievable, fabulous, amazing will
   * be equivalent to: incredible, unbelievable, fabulous, amazing => incredible.
   * Default is true.
   */
  expand?: boolean = true;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.SynonymTokenFilter";
}

/**
 * Truncates the terms to a specific length. This token filter is implemented
 * using Apache Lucene.
 */
model TruncateTokenFilter extends TokenFilter {
  /**
   * The length at which terms will be truncated. Default and maximum is 300.
   */
  @maxValue(300)
  length?: int32 = 300;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.TruncateTokenFilter";
}

/**
 * Filters out tokens with same text as the previous token. This token filter is
 * implemented using Apache Lucene.
 */
model UniqueTokenFilter extends TokenFilter {
  /**
   * A value indicating whether to remove duplicates only at the same position.
   * Default is false.
   */
  onlyOnSamePosition?: boolean;

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.UniqueTokenFilter";
}

/**
 * Splits words into subwords and performs optional transformations on subword
 * groups. This token filter is implemented using Apache Lucene.
 */
model WordDelimiterTokenFilter extends TokenFilter {
  /**
   * A value indicating whether to generate part words. If set, causes parts of
   * words to be generated; for example "AzureSearch" becomes "Azure" "Search".
   * Default is true.
   */
  generateWordParts?: boolean = true;

  /**
   * A value indicating whether to generate number subwords. Default is true.
   */
  generateNumberParts?: boolean = true;

  /**
   * A value indicating whether maximum runs of word parts will be catenated. For
   * example, if this is set to true, "Azure-Search" becomes "AzureSearch". Default
   * is false.
   */
  catenateWords?: boolean;

  /**
   * A value indicating whether maximum runs of number parts will be catenated. For
   * example, if this is set to true, "1-2" becomes "12". Default is false.
   */
  catenateNumbers?: boolean;

  /**
   * A value indicating whether all subword parts will be catenated. For example, if
   * this is set to true, "Azure-Search-1" becomes "AzureSearch1". Default is false.
   */
  catenateAll?: boolean;

  /**
   * A value indicating whether to split words on caseChange. For example, if this
   * is set to true, "AzureSearch" becomes "Azure" "Search". Default is true.
   */
  splitOnCaseChange?: boolean = true;

  /**
   * A value indicating whether original words will be preserved and added to the
   * subword list. Default is false.
   */
  preserveOriginal?: boolean;

  /**
   * A value indicating whether to split on numbers. For example, if this is set to
   * true, "Azure1Search" becomes "Azure" "1" "Search". Default is true.
   */
  splitOnNumerics?: boolean = true;

  /**
   * A value indicating whether to remove trailing "'s" for each subword. Default is
   * true.
   */
  stemEnglishPossessive?: boolean = true;

  /**
   * A list of tokens to protect from being delimited.
   */
  protectedWords?: string[];

  /**
   * A URI fragment specifying the type of token filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.WordDelimiterTokenFilter";
}

/**
 * A character filter that applies mappings defined with the mappings option.
 * Matching is greedy (longest pattern matching at a given point wins).
 * Replacement is allowed to be the empty string. This character filter is
 * implemented using Apache Lucene.
 */
model MappingCharFilter extends CharFilter {
  /**
   * A list of mappings of the following format: "a=>b" (all occurrences of the
   * character "a" will be replaced with character "b").
   */
  mappings: string[];

  /**
   * A URI fragment specifying the type of char filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.MappingCharFilter";
}

/**
 * A character filter that replaces characters in the input string. It uses a
 * regular expression to identify character sequences to preserve and a
 * replacement pattern to identify characters to replace. For example, given the
 * input text "aa bb aa bb", pattern "(aa)\s+(bb)", and replacement "$1#$2", the
 * result would be "aa#bb aa#bb". This character filter is implemented using
 * Apache Lucene.
 */
model PatternReplaceCharFilter extends CharFilter {
  /**
   * A regular expression pattern.
   */
  pattern: string;

  /**
   * The replacement text.
   */
  replacement: string;

  /**
   * A URI fragment specifying the type of char filter.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.PatternReplaceCharFilter";
}

/**
 * Legacy similarity algorithm which uses the Lucene TFIDFSimilarity
 * implementation of TF-IDF. This variation of TF-IDF introduces static document
 * length normalization as well as coordinating factors that penalize documents
 * that only partially match the searched queries.
 */
model ClassicSimilarityAlgorithm extends SimilarityAlgorithm {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.ClassicSimilarity";
}

/**
 * Ranking function based on the Okapi BM25 similarity algorithm. BM25 is a
 * TF-IDF-like algorithm that includes length normalization (controlled by the 'b'
 * parameter) as well as term frequency saturation (controlled by the 'k1'
 * parameter).
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model BM25SimilarityAlgorithm extends SimilarityAlgorithm {
  /**
   * This property controls the scaling function between the term frequency of each
   * matching terms and the final relevance score of a document-query pair. By
   * default, a value of 1.2 is used. A value of 0.0 means the score does not scale
   * with an increase in term frequency.
   */
  k1?: float64;

  /**
   * This property controls how the length of a document affects the relevance
   * score. By default, a value of 0.75 is used. A value of 0.0 means no length
   * normalization is applied, while a value of 1.0 means the score is fully
   * normalized by the length of the document.
   */
  b?: float64;

  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.BM25Similarity";
}

/**
 * Contains configuration options specific to the HNSW approximate nearest
 * neighbors algorithm used during indexing and querying. The HNSW algorithm
 * offers a tunable trade-off between search speed and accuracy.
 */
model HnswAlgorithmConfiguration extends VectorSearchAlgorithmConfiguration {
  /**
   * Contains the parameters specific to HNSW algorithm.
   */
  hnswParameters?: HnswParameters;

  /**
   * The name of the kind of algorithm being configured for use with vector search.
   */
  kind: "hnsw";
}

/**
 * Contains the parameters specific to the HNSW algorithm.
 */
model HnswParameters {
  /**
   * The number of bi-directional links created for every new element during
   * construction. Increasing this parameter value may improve recall and reduce
   * retrieval times for datasets with high intrinsic dimensionality at the expense
   * of increased memory consumption and longer indexing time.
   */
  @maxValue(10)
  @minValue(4)
  m?: int32 = 4;

  /**
   * The size of the dynamic list containing the nearest neighbors, which is used
   * during index time. Increasing this parameter may improve index quality, at the
   * expense of increased indexing time. At a certain point, increasing this
   * parameter leads to diminishing returns.
   */
  @maxValue(1000)
  @minValue(100)
  efConstruction?: int32 = 400;

  /**
   * The size of the dynamic list containing the nearest neighbors, which is used
   * during search time. Increasing this parameter may improve search results, at
   * the expense of slower search. At a certain point, increasing this parameter
   * leads to diminishing returns.
   */
  @maxValue(1000)
  @minValue(100)
  efSearch?: int32 = 500;

  /**
   * The similarity metric to use for vector comparisons.
   */
  metric?: VectorSearchAlgorithmMetric;
}

/**
 * Contains configuration options specific to the exhaustive KNN algorithm used
 * during querying, which will perform brute-force search across the entire vector
 * index.
 */
model ExhaustiveKnnAlgorithmConfiguration
  extends VectorSearchAlgorithmConfiguration {
  /**
   * Contains the parameters specific to exhaustive KNN algorithm.
   */
  exhaustiveKnnParameters?: ExhaustiveKnnParameters;

  /**
   * The name of the kind of algorithm being configured for use with vector search.
   */
  kind: "exhaustiveKnn";
}

/**
 * Contains the parameters specific to exhaustive KNN algorithm.
 */
model ExhaustiveKnnParameters {
  /**
   * The similarity metric to use for vector comparisons.
   */
  metric?: VectorSearchAlgorithmMetric;
}

/**
 * Contains configuration options specific to the scalar quantization compression
 * method used during indexing and querying.
 */
model ScalarQuantizationCompression extends VectorSearchCompression {
  /**
   * Contains the parameters specific to Scalar Quantization.
   */
  scalarQuantizationParameters?: ScalarQuantizationParameters;

  /**
   * The name of the kind of compression method being configured for use with vector
   * search.
   */
  kind: "scalarQuantization";
}

/**
 * Contains the parameters specific to Scalar Quantization.
 */
model ScalarQuantizationParameters {
  /**
   * The quantized data type of compressed vector values.
   */
  quantizedDataType?: VectorSearchCompressionTarget;
}

/**
 * Contains configuration options specific to the binary quantization compression
 * method used during indexing and querying.
 */
model BinaryQuantizationCompression extends VectorSearchCompression {
  /**
   * The name of the kind of compression method being configured for use with vector
   * search.
   */
  kind: "binaryQuantization";
}

/**
 * Specifies the Azure OpenAI resource used to vectorize a query string.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model AzureOpenAIVectorizer extends VectorSearchVectorizer {
  /**
   * Contains the parameters specific to Azure OpenAI embedding vectorization.
   */
  azureOpenAIParameters?: AzureOpenAIVectorizerParameters;

  /**
   * The name of the kind of vectorization method being configured for use with
   * vector search.
   */
  kind: "azureOpenAI";
}

/**
 * Specifies the parameters for connecting to the Azure OpenAI resource.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model AzureOpenAIVectorizerParameters {
  /**
   * The resource URI of the Azure OpenAI resource.
   */
  resourceUri?: url;

  /**
   * ID of the Azure OpenAI model deployment on the designated resource.
   */
  deploymentId?: string;

  /**
   * API key of the designated Azure OpenAI resource.
   */
  apiKey?: string;

  /**
   * The user-assigned managed identity used for outbound connections.
   */
  authIdentity?: SearchIndexerDataIdentity;

  /**
   * The name of the embedding model that is deployed at the provided deploymentId
   * path.
   */
  modelName?: AzureOpenAIModelName;
}

/**
 * Abstract base type for data identities.
 */
@discriminator("@odata.type")
model SearchIndexerDataIdentity {
  /**
   * A URI fragment specifying the type of identity.
   */
  #suppress "@azure-tools/typespec-azure-core/no-string-discriminator" "Existing"
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: string;
}

/**
 * Specifies a user-defined vectorizer for generating the vector embedding of a
 * query string. Integration of an external vectorizer is achieved using the
 * custom Web API interface of a skillset.
 */
model WebApiVectorizer extends VectorSearchVectorizer {
  /**
   * Specifies the properties of the user-defined vectorizer.
   */
  customWebApiParameters?: WebApiVectorizerParameters;

  /**
   * The name of the kind of vectorization method being configured for use with
   * vector search.
   */
  kind: "customWebApi";
}

/**
 * Specifies the properties for connecting to a user-defined vectorizer.
 */
model WebApiVectorizerParameters {
  /**
   * The URI of the Web API providing the vectorizer.
   */
  uri?: url;

  /**
   * The headers required to make the HTTP request.
   */
  httpHeaders?: Record<string>;

  /**
   * The method for the HTTP request.
   */
  httpMethod?: string;

  /**
   * The desired timeout for the request. Default is 30 seconds.
   */
  timeout?: duration;

  /**
   * Applies to custom endpoints that connect to external code in an Azure function
   * or some other application that provides the transformations. This value should
   * be the application ID created for the function or app when it was registered
   * with Azure Active Directory. When specified, the vectorization connects to the
   * function or app using a managed ID (either system or user-assigned) of the
   * search service and the access token of the function or app, using this value as
   * the resource id for creating the scope of the access token.
   */
  authResourceId?: string;

  /**
   * The user-assigned managed identity used for outbound connections. If an
   * authResourceId is provided and it's not specified, the system-assigned managed
   * identity is used. On updates to the indexer, if the identity is unspecified,
   * the value remains unchanged. If set to "none", the value of this property is
   * cleared.
   */
  authIdentity?: SearchIndexerDataIdentity;
}

/**
 * Specifies the AI Services Vision parameters for vectorizing a query image or
 * text.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AIServicesVisionVectorizer extends VectorSearchVectorizer {
  /**
   * Contains the parameters specific to AI Services Vision embedding vectorization.
   */
  AIServicesVisionParameters?: AIServicesVisionParameters;

  /**
   * The name of the kind of vectorization method being configured for use with
   * vector search.
   */
  kind: "aiServicesVision";
}

/**
 * Specifies the AI Services Vision parameters for vectorizing a query image or
 * text.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AIServicesVisionParameters {
  /**
   * The version of the model to use when calling the AI Services Vision service. It
   * will default to the latest available when not specified.
   */
  modelVersion: string;

  /**
   * The resource URI of the AI Services resource.
   */
  resourceUri: url;

  /**
   * API key of the designated AI Services resource.
   */
  apiKey?: string;

  /**
   * The user-assigned managed identity used for outbound connections. If an
   * authResourceId is provided and it's not specified, the system-assigned managed
   * identity is used. On updates to the index, if the identity is unspecified, the
   * value remains unchanged. If set to "none", the value of this property is
   * cleared.
   */
  authIdentity?: SearchIndexerDataIdentity;
}

/**
 * Specifies an Azure Machine Learning endpoint deployed via the Azure AI Studio
 * Model Catalog for generating the vector embedding of a query string.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AMLVectorizer extends VectorSearchVectorizer {
  /**
   * Specifies the properties of the AML vectorizer.
   */
  amlParameters?: AMLParameters;

  /**
   * The name of the kind of vectorization method being configured for use with
   * vector search.
   */
  kind: "aml";
}

/**
 * Specifies the properties for connecting to an AML vectorizer.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AMLParameters {
  /**
   * (Required for no authentication or key authentication) The scoring URI of the
   * AML service to which the JSON payload will be sent. Only the https URI scheme
   * is allowed.
   */
  uri: url;

  /**
   * (Required for key authentication) The key for the AML service.
   */
  key?: string;

  /**
   * (Required for token authentication). The Azure Resource Manager resource ID of
   * the AML service. It should be in the format
   * subscriptions/{guid}/resourceGroups/{resource-group-name}/Microsoft.MachineLearningServices/workspaces/{workspace-name}/services/{service_name}.
   */
  resourceId?: string;

  /**
   * (Optional) When specified, indicates the timeout for the http client making the
   * API call.
   */
  timeout?: duration;

  /**
   * (Optional for token authentication). The region the AML service is deployed in.
   */
  region?: string;

  /**
   * The name of the embedding model from the Azure AI Studio Catalog that is
   * deployed at the provided endpoint.
   */
  modelName?: AIStudioModelCatalogName;
}

/**
 * A URI fragment specifying the type of identity.
 */
model SearchIndexerDataNoneIdentity extends SearchIndexerDataIdentity {
  /** The discriminator for derived types. */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.DataNoneIdentity";
}

/**
 * Specifies the identity for a datasource to use.
 */
model SearchIndexerDataUserAssignedIdentity extends SearchIndexerDataIdentity {
  /**
   * The fully qualified Azure resource Id of a user assigned managed identity
   * typically in the form
   * "/subscriptions/12345678-1234-1234-1234-1234567890ab/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myId"
   * that should have been assigned to the search service.
   */
  userAssignedIdentity: string;

  /**
   * A URI fragment specifying the type of identity.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.DataUserAssignedIdentity";
}

/**
 * Defines a data change detection policy that captures changes based on the value
 * of a high water mark column.
 */
model HighWaterMarkChangeDetectionPolicy extends DataChangeDetectionPolicy {
  /**
   * The name of the high water mark column.
   */
  highWaterMarkColumnName: string;

  /**
   * A URI fragment specifying the type of data change detection policy.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy";
}

/**
 * Defines a data change detection policy that captures changes using the
 * Integrated Change Tracking feature of Azure SQL Database.
 */
model SqlIntegratedChangeTrackingPolicy extends DataChangeDetectionPolicy {
  /**
   * A URI fragment specifying the type of data change detection policy.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.SqlIntegratedChangeTrackingPolicy";
}

/**
 * Defines a data deletion detection policy that implements a soft-deletion
 * strategy. It determines whether an item should be deleted based on the value of
 * a designated 'soft delete' column.
 */
model SoftDeleteColumnDeletionDetectionPolicy
  extends DataDeletionDetectionPolicy {
  /**
   * The name of the column to use for soft-deletion detection.
   */
  softDeleteColumnName?: string;

  /**
   * The marker value that identifies an item as deleted.
   */
  softDeleteMarkerValue?: string;

  /**
   * A URI fragment specifying the type of data deletion detection policy.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy";
}

/**
 * Defines a data deletion detection policy utilizing Azure Blob Storage's native
 * soft delete feature for deletion detection.
 */
@added(Versions.v2024_11_01_preview)
model NativeBlobSoftDeleteDeletionDetectionPolicy
  extends DataDeletionDetectionPolicy {
  /**
   * A URI fragment specifying the type of data deletion detection policy.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.NativeBlobSoftDeleteDeletionDetectionPolicy";
}

/**
 * Defines a function that boosts scores based on distance from a geographic
 * location.
 */
model DistanceScoringFunction extends ScoringFunction {
  /**
   * Parameter values for the distance scoring function.
   */
  distance: DistanceScoringParameters;

  /**
   * Indicates the type of function to use. Valid values include magnitude,
   * freshness, distance, and tag. The function type must be lower case.
   */
  type: "distance";
}

/**
 * Provides parameter values to a distance scoring function.
 */
model DistanceScoringParameters {
  /**
   * The name of the parameter passed in search queries to specify the reference
   * location.
   */
  referencePointParameter: string;

  /**
   * The distance in kilometers from the reference location where the boosting range
   * ends.
   */
  boostingDistance: float64;
}

/**
 * Defines a function that boosts scores based on the value of a date-time field.
 */
model FreshnessScoringFunction extends ScoringFunction {
  /**
   * Parameter values for the freshness scoring function.
   */
  freshness: FreshnessScoringParameters;

  /**
   * Indicates the type of function to use. Valid values include magnitude,
   * freshness, distance, and tag. The function type must be lower case.
   */
  type: "freshness";
}

/**
 * Provides parameter values to a freshness scoring function.
 */
model FreshnessScoringParameters {
  /**
   * The expiration period after which boosting will stop for a particular document.
   */
  boostingDuration: duration;
}

/**
 * Defines a function that boosts scores based on the magnitude of a numeric field.
 */
model MagnitudeScoringFunction extends ScoringFunction {
  /**
   * Parameter values for the magnitude scoring function.
   */
  magnitude: MagnitudeScoringParameters;

  /**
   * Indicates the type of function to use. Valid values include magnitude,
   * freshness, distance, and tag. The function type must be lower case.
   */
  type: "magnitude";
}

/**
 * Provides parameter values to a magnitude scoring function.
 */
model MagnitudeScoringParameters {
  /**
   * The field value at which boosting starts.
   */
  boostingRangeStart: float64;

  /**
   * The field value at which boosting ends.
   */
  boostingRangeEnd: float64;

  /**
   * A value indicating whether to apply a constant boost for field values beyond
   * the range end value; default is false.
   */
  constantBoostBeyondRange?: boolean;
}

/**
 * Defines a function that boosts scores of documents with string values matching
 * a given list of tags.
 */
model TagScoringFunction extends ScoringFunction {
  /**
   * Parameter values for the tag scoring function.
   */
  tag: TagScoringParameters;

  /**
   * Indicates the type of function to use. Valid values include magnitude,
   * freshness, distance, and tag. The function type must be lower case.
   */
  type: "tag";
}

/**
 * Provides parameter values to a tag scoring function.
 */
model TagScoringParameters {
  /**
   * The name of the parameter passed in search queries to specify the list of tags
   * to compare against the target field.
   */
  tagsParameter: string;
}

/**
 * A dictionary of knowledge store-specific configuration properties. Each name is
 * the name of a specific property. Each value must be of a primitive type.
 */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
model SearchIndexerKnowledgeStoreParameters {
  ...Record<unknown>;

  /**
   * Whether or not projections should synthesize a generated key name if one isn't
   * already present.
   */
  synthesizeGeneratedKeyName?: boolean;
}

/**
 * An empty object that represents the default Azure AI service resource for a
 * skillset.
 */
model DefaultCognitiveServicesAccount extends CognitiveServicesAccount {
  /**
   * A URI fragment specifying the type of Azure AI service resource attached to a
   * skillset.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.DefaultCognitiveServices";
}

/**
 * The multi-region account key of an Azure AI service resource that's attached to
 * a skillset.
 */
model CognitiveServicesAccountKey extends CognitiveServicesAccount {
  /**
   * The key used to provision the Azure AI service resource attached to a skillset.
   */
  key: string;

  /**
   * A URI fragment specifying the type of Azure AI service resource attached to a
   * skillset.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.CognitiveServicesByKey";
}

/**
 * The account key of an Azure AI service resource that's attached to a skillset,
 * to be used with the resource's subdomain.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AIServicesAccountKey extends CognitiveServicesAccount {
  /**
   * The key used to provision the Azure AI service resource attached to a skillset.
   */
  key: string;

  /**
   * The subdomain url for the corresponding AI Service.
   */
  subdomainUrl: string;

  /**
   * A URI fragment specifying the type of Azure AI service resource attached to a
   * skillset.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.AIServicesByKey";
}

/**
 * The multi-region account of an Azure AI service resource that's attached to a
 * skillset.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@added(Versions.v2024_11_01_preview)
model AIServicesAccountIdentity extends CognitiveServicesAccount {
  /**
   * The user-assigned managed identity used for connections to AI Service. If not
   * specified, the system-assigned managed identity is used. On updates to the
   * skillset, if the identity is unspecified, the value remains unchanged. If set
   * to "none", the value of this property is cleared.
   */
  identity: SearchIndexerDataIdentity;

  /**
   * The subdomain url for the corresponding AI Service.
   */
  subdomainUrl: string;

  /**
   * A URI fragment specifying the type of Azure AI service resource attached to a
   * skillset.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Azure.Search.AIServicesByIdentity";
}

/**
 * An object that contains information about the matches that were found, and
 * related metadata.
 */
model CustomEntity {
  /**
   * The top-level entity descriptor. Matches in the skill output will be grouped by
   * this name, and it should represent the "normalized" form of the text being
   * found.
   */
  name: string;

  /**
   * This field can be used as a passthrough for custom metadata about the matched
   * text(s). The value of this field will appear with every match of its entity in
   * the skill output.
   */
  description?: string;

  /**
   * This field can be used as a passthrough for custom metadata about the matched
   * text(s). The value of this field will appear with every match of its entity in
   * the skill output.
   */
  type?: string;

  /**
   * This field can be used as a passthrough for custom metadata about the matched
   * text(s). The value of this field will appear with every match of its entity in
   * the skill output.
   */
  subtype?: string;

  /**
   * This field can be used as a passthrough for custom metadata about the matched
   * text(s). The value of this field will appear with every match of its entity in
   * the skill output.
   */
  id?: string;

  /**
   * Defaults to false. Boolean value denoting whether comparisons with the entity
   * name should be sensitive to character casing. Sample case insensitive matches
   * of "Microsoft" could be: microsoft, microSoft, MICROSOFT.
   */
  caseSensitive?: boolean;

  /**
   * Defaults to false. Boolean value denoting whether comparisons with the entity
   * name should be sensitive to accent.
   */
  accentSensitive?: boolean;

  /**
   * Defaults to 0. Maximum value of 5. Denotes the acceptable number of divergent
   * characters that would still constitute a match with the entity name. The
   * smallest possible fuzziness for any given match is returned. For instance, if
   * the edit distance is set to 3, "Windows10" would still match "Windows",
   * "Windows10" and "Windows 7". When case sensitivity is set to false, case
   * differences do NOT count towards fuzziness tolerance, but otherwise do.
   */
  fuzzyEditDistance?: int32;

  /**
   * Changes the default case sensitivity value for this entity. It be used to
   * change the default value of all aliases caseSensitive values.
   */
  defaultCaseSensitive?: boolean;

  /**
   * Changes the default accent sensitivity value for this entity. It be used to
   * change the default value of all aliases accentSensitive values.
   */
  defaultAccentSensitive?: boolean;

  /**
   * Changes the default fuzzy edit distance value for this entity. It can be used
   * to change the default value of all aliases fuzzyEditDistance values.
   */
  defaultFuzzyEditDistance?: int32;

  /**
   * An array of complex objects that can be used to specify alternative spellings
   * or synonyms to the root entity name.
   */
  aliases?: CustomEntityAlias[];
}

/**
 * A complex object that can be used to specify alternative spellings or synonyms
 * to the root entity name.
 */
model CustomEntityAlias {
  /**
   * The text of the alias.
   */
  text: string;

  /**
   * Determine if the alias is case sensitive.
   */
  caseSensitive?: boolean;

  /**
   * Determine if the alias is accent sensitive.
   */
  accentSensitive?: boolean;

  /**
   * Determine the fuzzy edit distance of the alias.
   */
  fuzzyEditDistance?: int32;
}

/**
 * A skill that enables scenarios that require a Boolean operation to determine
 * the data to assign to an output.
 */
model ConditionalSkill extends SearchIndexerSkill {
  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Util.ConditionalSkill";
}

/**
 * A skill that uses text analytics for key phrase extraction.
 */
model KeyPhraseExtractionSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: KeyPhraseExtractionSkillLanguage;

  /**
   * A number indicating how many key phrases to return. If absent, all identified
   * key phrases will be returned.
   */
  maxKeyPhraseCount?: int32;

  /**
   * The version of the model to use when calling the Text Analytics service. It
   * will default to the latest available when not specified. We recommend you do
   * not specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.KeyPhraseExtractionSkill";
}

/**
 * A skill that extracts text from image files.
 */
model OcrSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: OcrSkillLanguage;

  /**
   * A value indicating to turn orientation detection on or not. Default is false.
   */
  detectOrientation?: boolean;

  /**
   * Defines the sequence of characters to use between the lines of text recognized
   * by the OCR skill. The default value is "space".
   */
  lineEnding?: OcrLineEnding;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Vision.OcrSkill";
}

/**
 * A skill that analyzes image files. It extracts a rich set of visual features
 * based on the image content.
 */
model ImageAnalysisSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: ImageAnalysisSkillLanguage;

  /**
   * A list of visual features.
   */
  visualFeatures?: VisualFeature[];

  /**
   * A string indicating which domain-specific details to return.
   */
  details?: ImageDetail[];

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Vision.ImageAnalysisSkill";
}

/**
 * A skill that detects the language of input text and reports a single language
 * code for every document submitted on the request. The language code is paired
 * with a score indicating the confidence of the analysis.
 */
model LanguageDetectionSkill extends SearchIndexerSkill {
  /**
   * A country code to use as a hint to the language detection model if it cannot
   * disambiguate the language.
   */
  defaultCountryHint?: string;

  /**
   * The version of the model to use when calling the Text Analytics service. It
   * will default to the latest available when not specified. We recommend you do
   * not specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.LanguageDetectionSkill";
}

/**
 * A skill for reshaping the outputs. It creates a complex type to support
 * composite fields (also known as multipart fields).
 */
model ShaperSkill extends SearchIndexerSkill {
  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Util.ShaperSkill";
}

/**
 * A skill for merging two or more strings into a single unified string, with an
 * optional user-defined delimiter separating each component part.
 */
model MergeSkill extends SearchIndexerSkill {
  /**
   * The tag indicates the start of the merged text. By default, the tag is an empty
   * space.
   */
  insertPreTag?: string = " ";

  /**
   * The tag indicates the end of the merged text. By default, the tag is an empty
   * space.
   */
  insertPostTag?: string = " ";

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.MergeSkill";
}

/**
 * This skill is deprecated. Use the V3.EntityRecognitionSkill instead.
 */
model EntityRecognitionSkill extends SearchIndexerSkill {
  /**
   * A list of entity categories that should be extracted.
   */
  categories?: EntityCategory[];

  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: EntityRecognitionSkillLanguage;

  /**
   * Determines whether or not to include entities which are well known but don't
   * conform to a pre-defined type. If this configuration is not set (default), set
   * to null or set to false, entities which don't conform to one of the pre-defined
   * types will not be surfaced.
   */
  includeTypelessEntities?: boolean;

  /**
   * A value between 0 and 1 that be used to only include entities whose confidence
   * score is greater than the value specified. If not set (default), or if
   * explicitly set to null, all entities will be included.
   */
  minimumPrecision?: float64;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.EntityRecognitionSkill";
}

/**
 * This skill is deprecated. Use the V3.SentimentSkill instead.
 */
model SentimentSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: SentimentSkillLanguage;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.SentimentSkill";
}

/**
 * Using the Text Analytics API, evaluates unstructured text and for each record,
 * provides sentiment labels (such as "negative", "neutral" and "positive") based
 * on the highest confidence score found by the service at a sentence and
 * document-level.
 */
model SentimentSkillV3 extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: string;

  /**
   * If set to true, the skill output will include information from Text Analytics
   * for opinion mining, namely targets (nouns or verbs) and their associated
   * assessment (adjective) in the text. Default is false.
   */
  includeOpinionMining?: boolean;

  /**
   * The version of the model to use when calling the Text Analytics service. It
   * will default to the latest available when not specified. We recommend you do
   * not specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.V3.SentimentSkill";
}

/**
 * Using the Text Analytics API, extracts linked entities from text.
 */
model EntityLinkingSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: string;

  /**
   * A value between 0 and 1 that be used to only include entities whose confidence
   * score is greater than the value specified. If not set (default), or if
   * explicitly set to null, all entities will be included.
   */
  @maxValue(1)
  minimumPrecision?: float64;

  /**
   * The version of the model to use when calling the Text Analytics service. It
   * will default to the latest available when not specified. We recommend you do
   * not specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.V3.EntityLinkingSkill";
}

/**
 * Using the Text Analytics API, extracts entities of different types from text.
 */
model EntityRecognitionSkillV3 extends SearchIndexerSkill {
  /**
   * A list of entity categories that should be extracted.
   */
  categories?: string[];

  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: string;

  /**
   * A value between 0 and 1 that be used to only include entities whose confidence
   * score is greater than the value specified. If not set (default), or if
   * explicitly set to null, all entities will be included.
   */
  @maxValue(1)
  minimumPrecision?: float64;

  /**
   * The version of the model to use when calling the Text Analytics API. It will
   * default to the latest available when not specified. We recommend you do not
   * specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.V3.EntityRecognitionSkill";
}

/**
 * Using the Text Analytics API, extracts personal information from an input text
 * and gives you the option of masking it.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model PIIDetectionSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: string;

  /**
   * A value between 0 and 1 that be used to only include entities whose confidence
   * score is greater than the value specified. If not set (default), or if
   * explicitly set to null, all entities will be included.
   */
  @maxValue(1)
  minimumPrecision?: float64;

  /**
   * A parameter that provides various ways to mask the personal information
   * detected in the input text. Default is 'none'.
   */
  maskingMode?: PIIDetectionSkillMaskingMode;

  /**
   * The character used to mask the text if the maskingMode parameter is set to
   * replace. Default is '*'.
   */
  @maxLength(1)
  maskingCharacter?: string;

  /**
   * The version of the model to use when calling the Text Analytics service. It
   * will default to the latest available when not specified. We recommend you do
   * not specify this value unless absolutely necessary.
   */
  modelVersion?: string;

  /**
   * A list of PII entity categories that should be extracted and masked.
   */
  piiCategories?: string[];

  /**
   * If specified, will set the PII domain to include only a subset of the entity
   * categories. Possible values include: 'phi', 'none'. Default is 'none'.
   */
  domain?: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.PIIDetectionSkill";
}

/**
 * A skill to split a string into chunks of text.
 */
model SplitSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: SplitSkillLanguage;

  /**
   * A value indicating which split mode to perform.
   */
  textSplitMode?: TextSplitMode;

  /**
   * The desired maximum page length. Default is 10000.
   */
  maximumPageLength?: int32;

  /**
   * Only applicable when textSplitMode is set to 'pages'. If specified, n+1th chunk
   * will start with this number of characters/tokens from the end of the nth chunk.
   */
  pageOverlapLength?: int32;

  /**
   * Only applicable when textSplitMode is set to 'pages'. If specified, the
   * SplitSkill will discontinue splitting after processing the first 'maximumPagesToTake'
   * pages, in order to improve performance when only a few
   * initial pages are needed from each document.
   */
  maximumPagesToTake?: int32;

  /**
   * Only applies if textSplitMode is set to pages. There are two possible values.
   * The choice of the values will decide the length (maximumPageLength and
   * pageOverlapLength) measurement. The default is 'characters', which means the
   * length will be measured by character.
   */
  @added(Versions.v2024_11_01_preview)
  unit?: SplitSkillUnit;

  /**
   * Only applies if the unit is set to azureOpenAITokens. If specified, the
   * splitSkill will use these parameters when performing the tokenization. The
   * parameters are a valid 'encoderModelName' and an optional 'allowedSpecialTokens' property.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  @added(Versions.v2024_11_01_preview)
  azureOpenAITokenizerParameters?: AzureOpenAITokenizerParameters;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.SplitSkill";
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
@doc("Azure OpenAI Tokenizer parameters.")
@added(Versions.v2024_11_01_preview)
model AzureOpenAITokenizerParameters {
  /**
   * Only applies if the unit is set to azureOpenAITokens. Options include
   * 'R50k_base', 'P50k_base', 'P50k_edit' and 'CL100k_base'. The default value is 'CL100k_base'.
   */
  encoderModelName?: SplitSkillEncoderModelName;

  /**
   * (Optional) Only applies if the unit is set to azureOpenAITokens. This parameter
   * defines a collection of special tokens that are permitted within the
   * tokenization process.
   */
  allowedSpecialTokens?: string[];
}

/**
 * A skill looks for text from a custom, user-defined list of words and phrases.
 */
model CustomEntityLookupSkill extends SearchIndexerSkill {
  /**
   * A value indicating which language code to use. Default is `en`.
   */
  defaultLanguageCode?: CustomEntityLookupSkillLanguage;

  /**
   * Path to a JSON or CSV file containing all the target text to match against.
   * This entity definition is read at the beginning of an indexer run. Any updates
   * to this file during an indexer run will not take effect until subsequent runs.
   * This config must be accessible over HTTPS.
   */
  entitiesDefinitionUri?: string;

  /**
   * The inline CustomEntity definition.
   */
  inlineEntitiesDefinition?: CustomEntity[];

  /**
   * A global flag for CaseSensitive. If CaseSensitive is not set in CustomEntity,
   * this value will be the default value.
   */
  globalDefaultCaseSensitive?: boolean;

  /**
   * A global flag for AccentSensitive. If AccentSensitive is not set in
   * CustomEntity, this value will be the default value.
   */
  globalDefaultAccentSensitive?: boolean;

  /**
   * A global flag for FuzzyEditDistance. If FuzzyEditDistance is not set in
   * CustomEntity, this value will be the default value.
   */
  globalDefaultFuzzyEditDistance?: int32;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.CustomEntityLookupSkill";
}

/**
 * A skill to translate text from one language to another.
 */
model TextTranslationSkill extends SearchIndexerSkill {
  /**
   * The language code to translate documents into for documents that don't specify
   * the to language explicitly.
   */
  defaultToLanguageCode: TextTranslationSkillLanguage;

  /**
   * The language code to translate documents from for documents that don't specify
   * the from language explicitly.
   */
  defaultFromLanguageCode?: TextTranslationSkillLanguage;

  /**
   * The language code to translate documents from when neither the fromLanguageCode
   * input nor the defaultFromLanguageCode parameter are provided, and the automatic
   * language detection is unsuccessful. Default is `en`.
   */
  suggestedFrom?: TextTranslationSkillLanguage;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.TranslationSkill";
}

/**
 * A skill that extracts content from a file within the enrichment pipeline.
 */
model DocumentExtractionSkill extends SearchIndexerSkill {
  /**
   * The parsingMode for the skill. Will be set to 'default' if not defined.
   */
  parsingMode?: string;

  /**
   * The type of data to be extracted for the skill. Will be set to 'contentAndMetadata' if not defined.
   */
  dataToExtract?: string;

  /**
   * A dictionary of configurations for the skill.
   */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "model should have additionalProperties"
  configuration?: Record<unknown>;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Util.DocumentExtractionSkill";
}

/**
 * A skill that extracts content and layout information (as markdown), via Azure
 * AI Services, from files within the enrichment pipeline.
 */
@added(Versions.v2024_11_01_preview)
model DocumentIntelligenceLayoutSkill extends SearchIndexerSkill {
  /**
   * Controls the cardinality of the output produced by the skill. Default is 'oneToMany'.
   */
  outputMode?: DocumentIntelligenceLayoutSkillOutputMode = DocumentIntelligenceLayoutSkillOutputMode.OneToMany;

  /**
   * The depth of headers in the markdown output. Default is h6.
   */
  markdownHeaderDepth?: DocumentIntelligenceLayoutSkillMarkdownHeaderDepth = DocumentIntelligenceLayoutSkillMarkdownHeaderDepth.H6;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Util.DocumentIntelligenceLayoutSkill";
}

/**
 * A skill that can call a Web API endpoint, allowing you to extend a skillset by
 * having it call your custom code.
 */
model WebApiSkill extends SearchIndexerSkill {
  /**
   * The url for the Web API.
   */
  uri: string;

  /**
   * The headers required to make the http request.
   */
  httpHeaders?: Record<string>;

  /**
   * The method for the http request.
   */
  httpMethod?: string;

  /**
   * The desired timeout for the request. Default is 30 seconds.
   */
  timeout?: duration;

  /**
   * The desired batch size which indicates number of documents.
   */
  batchSize?: int32;

  /**
   * If set, the number of parallel calls that can be made to the Web API.
   */
  degreeOfParallelism?: int32;

  /**
   * Applies to custom skills that connect to external code in an Azure function or
   * some other application that provides the transformations. This value should be
   * the application ID created for the function or app when it was registered with
   * Azure Active Directory. When specified, the custom skill connects to the
   * function or app using a managed ID (either system or user-assigned) of the
   * search service and the access token of the function or app, using this value as
   * the resource id for creating the scope of the access token.
   */
  authResourceId?: string;

  /**
   * The user-assigned managed identity used for outbound connections. If an
   * authResourceId is provided and it's not specified, the system-assigned managed
   * identity is used. On updates to the indexer, if the identity is unspecified,
   * the value remains unchanged. If set to "none", the value of this property is
   * cleared.
   */
  authIdentity?: SearchIndexerDataIdentity;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Custom.WebApiSkill";
}

/**
 * The AML skill allows you to extend AI enrichment with a custom Azure Machine
 * Learning (AML) model. Once an AML model is trained and deployed, an AML skill
 * integrates it into AI enrichment.
 */
@added(Versions.v2024_11_01_preview)
model AzureMachineLearningSkill extends SearchIndexerSkill {
  /**
   * (Required for no authentication or key authentication) The scoring URI of the
   * AML service to which the JSON payload will be sent. Only the https URI scheme
   * is allowed.
   */
  uri?: url;

  /**
   * (Required for key authentication) The key for the AML service.
   */
  key?: string;

  /**
   * (Required for token authentication). The Azure Resource Manager resource ID of
   * the AML service. It should be in the format
   * subscriptions/{guid}/resourceGroups/{resource-group-name}/Microsoft.MachineLearningServices/workspaces/{workspace-name}/services/{service_name}.
   */
  resourceId?: string;

  /**
   * (Optional) When specified, indicates the timeout for the http client making the
   * API call.
   */
  timeout?: duration;

  /**
   * (Optional for token authentication). The region the AML service is deployed in.
   */
  region?: string;

  /**
   * (Optional) When specified, indicates the number of calls the indexer will make
   * in parallel to the endpoint you have provided. You can decrease this value if
   * your endpoint is failing under too high of a request load, or raise it if your
   * endpoint is able to accept more requests and you would like an increase in the
   * performance of the indexer. If not set, a default value of 5 is used. The
   * degreeOfParallelism can be set to a maximum of 10 and a minimum of 1.
   */
  degreeOfParallelism?: int32;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Custom.AmlSkill";
}

/**
 * Allows you to generate a vector embedding for a given text input using the
 * Azure OpenAI resource.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
model AzureOpenAIEmbeddingSkill extends SearchIndexerSkill {
  ...AzureOpenAIVectorizerParameters;

  /**
   * The number of dimensions the resulting output embeddings should have. Only
   * supported in text-embedding-3 and later models.
   */
  dimensions?: int32;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill";
}

/**
 * Allows you to generate a vector embedding for a given image or text input using
 * the Azure AI Services Vision Vectorize API.
 */
@added(Versions.v2024_11_01_preview)
model VisionVectorizeSkill extends SearchIndexerSkill {
  /**
   * The version of the model to use when calling the AI Services Vision service. It
   * will default to the latest available when not specified.
   */
  modelVersion: string;

  /**
   * A URI fragment specifying the type of skill.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Maintain compatibility with existing models."
  `@odata.type`: "#Microsoft.Skills.Vision.VectorizeSkill";
}
