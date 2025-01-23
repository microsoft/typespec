import "@azure-tools/typespec-client-generator-core";
import "@typespec/versioning";
import "./main.tsp";

using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;
using Search;

@TypeSpec.Versioning.useDependency(Search.Versions.v2024_07_01)
namespace Customizations;

@@access(VectorSearchAlgorithmKind, Access.public);
@@usage(VectorSearchAlgorithmKind, Usage.input);
@@access(VectorSearchVectorizerKind, Access.public);
@@usage(VectorSearchVectorizerKind, Usage.input);
@@clientName(VectorQuery.k, "kNearestNeighbors");
@@clientName(SearchDocumentsResult.value, "results");
@@clientName(SearchRequest.count, "includeTotalResultCount");
@@clientName(SearchRequest.highlight, "highlightFields");
@@clientName(SearchRequest.search, "searchText");
@@clientName(SearchRequest.orderby, "orderBy");
@@clientName(SuggestDocumentsResult.value, "results");
@@clientName(SuggestRequest.fuzzy, "useFuzzyMatching");
@@clientName(SuggestRequest.orderby, "orderBy");
@@clientName(SuggestRequest.search, "searchText");
@@clientName(IndexBatch.value, "actions");
@@clientName(IndexDocumentsResult.value, "results");
@@clientName(IndexingResult.status, "succeeded");
@@clientName(AutocompleteResult.value, "results");
@@clientName(AutocompleteRequest.search, "searchText");
@@clientName(AutocompleteRequest.fuzzy, "useFuzzyMatching");
@@clientName(ListDataSourcesResult.value, "dataSources");
@@clientName(SearchResourceEncryptionKey.keyVaultKeyName, "keyName");
@@clientName(SearchResourceEncryptionKey.keyVaultKeyVersion, "keyVersion");
@@clientName(SearchResourceEncryptionKey.keyVaultUri, "vaultUri");
@@clientName(SearchIndexer.disabled, "isDisabled");
@@clientName(ListIndexersResult.value, "indexers");
@@clientName(IndexerExecutionResult.itemsProcessed, "itemCount");
@@clientName(IndexerExecutionResult.itemsFailed, "failedItemCount");
@@clientName(SearchIndexerSkillset.cognitiveServices,
  "cognitiveServicesAccount"
);
@@clientName(SearchIndexerSkillset.indexProjections, "indexProjection");
@@clientName(ListSkillsetsResult.value, "skillsets");
@@clientName(ListSynonymMapsResult.value, "synonymMaps");
@@clientName(SearchIndex.semantic, "semanticSearch");
@@clientName(SearchField.dimensions, "vectorSearchDimensions");
@@clientName(SearchField.vectorSearchProfile, "vectorSearchProfileName");
@@clientName(SearchField.vectorEncoding, "vectorEncodingFormat");
@@clientName(ScoringProfile.text, "textWeights");
@@clientName(SemanticSearch.defaultConfiguration, "defaultConfigurationName");
@@clientName(SemanticPrioritizedFields.prioritizedContentFields,
  "contentFields"
);
@@clientName(SemanticPrioritizedFields.prioritizedKeywordsFields,
  "keywordsFields"
);
@@clientName(VectorSearchProfile.algorithm, "algorithmConfigurationName");
@@clientName(VectorSearchProfile.vectorizer, "vectorizerName");
@@clientName(VectorSearchProfile.compression, "compressionName");
@@clientName(VectorSearchVectorizer.name, "vectorizerName");
@@clientName(VectorSearchCompression.name, "compressionName");
@@clientName(ListIndexesResult.value, "indexes");
@@clientName(SearchServiceCounters.aliasesCount, "aliasCounter");
@@clientName(SearchServiceCounters.documentCount, "documentCounter");
@@clientName(SearchServiceCounters.indexesCount, "indexCounter");
@@clientName(SearchServiceCounters.indexersCount, "indexerCounter");
@@clientName(SearchServiceCounters.dataSourcesCount, "dataSourceCounter");
@@clientName(SearchServiceCounters.storageSize, "storageSizeCounter");
@@clientName(SearchServiceCounters.synonymMaps, "synonymMapCounter");
@@clientName(SearchServiceCounters.skillsetCount, "skillsetCounter");
@@clientName(SearchServiceCounters.vectorIndexSize, "vectorIndexSizeCounter");
@@clientName(SearchServiceLimits.maxStoragePerIndex,
  "maxStoragePerIndexInBytes"
);
@@clientName(PatternAnalyzer.lowercase, "lowerCaseTerms");
@@clientName(PathHierarchyTokenizerV2.reverse, "reverseTokenOrder");
@@clientName(PathHierarchyTokenizerV2.skip, "numberOfTokensToSkip");
@@clientName(CommonGramTokenFilter.queryMode, "useQueryMode");
@@clientName(KeepTokenFilter.keepWordsCase, "lowerCaseKeepWords");
@@clientName(LengthTokenFilter.min, "minLength");
@@clientName(LengthTokenFilter.max, "maxLength");
@@clientName(PhoneticTokenFilter.replace, "replaceOriginalTokens");
@@clientName(StopwordsTokenFilter.removeTrailing, "removeTrailingStopWords");
@@clientName(HnswAlgorithmConfiguration.hnswParameters, "parameters");
@@clientName(ExhaustiveKnnAlgorithmConfiguration.exhaustiveKnnParameters,
  "parameters"
);
@@clientName(ScalarQuantizationCompression.scalarQuantizationParameters,
  "parameters"
);
@@clientName(AzureOpenAIVectorizer.azureOpenAIParameters, "parameters");
@@clientName(AzureOpenAIVectorizerParameters.resourceUri, "resourceUrl");
@@clientName(AzureOpenAIVectorizerParameters.deploymentId, "deploymentName");
@@clientName(WebApiVectorizer.customWebApiParameters, "webApiParameters");
@@clientName(WebApiVectorizerParameters.uri, "url");
@@clientName(SearchIndexerDataUserAssignedIdentity.userAssignedIdentity,
  "resourceId"
);
@@clientName(DistanceScoringFunction.distance, "parameters");
@@clientName(FreshnessScoringFunction.freshness, "parameters");
@@clientName(MagnitudeScoringFunction.magnitude, "parameters");
@@clientName(MagnitudeScoringParameters.constantBoostBeyondRange,
  "shouldBoostBeyondRangeByConstant"
);
@@clientName(TagScoringFunction.tag, "parameters");
@@clientName(OcrSkill.detectOrientation, "shouldDetectOrientation");
@@clientName(PIIDetectionSkill.maskingCharacter, "mask");
@@clientName(ListAliasesResult.value, "aliases");
@@clientName(AMLParameters.uri, "scoringUri");
@@clientName(AMLParameters.key, "authenticationKey");
@@clientName(AMLVectorizer.amlParameters, "AMLParameters");
@@clientName(AzureMachineLearningSkill.uri, "scoringUri");
@@clientName(AzureMachineLearningSkill.key, "authenticationKey");
@@clientName(SkillNames.skillNames, "skillNameList", "csharp");
@@clientName(AMLParameters, "AzureMachineLearningParameters");
@@clientName(AMLVectorizer, "AzureMachineLearningVectorizer");
@@clientName(DataChangeDetectionPolicy.`@odata.type`, "odataType");
@@clientName(DataDeletionDetectionPolicy.`@odata.type`, "odataType");
@@clientName(SearchIndexerSkill.`@odata.type`, "odataType");
@@clientName(CognitiveServicesAccount.`@odata.type`, "odataType");
@@clientName(LexicalAnalyzer.`@odata.type`, "odataType");
@@clientName(LexicalTokenizer.`@odata.type`, "odataType");
@@clientName(TokenFilter.`@odata.type`, "odataType");
@@clientName(CharFilter.`@odata.type`, "odataType");
@@clientName(LexicalNormalizer.`@odata.type`, "odataType");
@@clientName(SimilarityAlgorithm.`@odata.type`, "odataType");
@@clientName(CustomAnalyzer.`@odata.type`, "odataType");
@@clientName(PatternAnalyzer.`@odata.type`, "odataType");
@@clientName(LuceneStandardAnalyzer.`@odata.type`, "odataType");
@@clientName(StopAnalyzer.`@odata.type`, "odataType");
@@clientName(CustomNormalizer.`@odata.type`, "odataType");
@@clientName(ClassicTokenizer.`@odata.type`, "odataType");
@@clientName(EdgeNGramTokenizer.`@odata.type`, "odataType");
@@clientName(KeywordTokenizer.`@odata.type`, "odataType");
@@clientName(KeywordTokenizerV2.`@odata.type`, "odataType");
@@clientName(MicrosoftLanguageTokenizer.`@odata.type`, "odataType");
@@clientName(MicrosoftLanguageStemmingTokenizer.`@odata.type`, "odataType");
@@clientName(NGramTokenizer.`@odata.type`, "odataType");
@@clientName(PatternTokenizer.`@odata.type`, "odataType");
@@clientName(LuceneStandardTokenizer.`@odata.type`, "odataType");
@@clientName(LuceneStandardTokenizerV2.`@odata.type`, "odataType");
@@clientName(UaxUrlEmailTokenizer.`@odata.type`, "odataType");
@@clientName(AsciiFoldingTokenFilter.`@odata.type`, "odataType");
@@clientName(CjkBigramTokenFilter.`@odata.type`, "odataType");
@@clientName(CommonGramTokenFilter.`@odata.type`, "odataType");
@@clientName(DictionaryDecompounderTokenFilter.`@odata.type`, "odataType");
@@clientName(EdgeNGramTokenFilter.`@odata.type`, "odataType");
@@clientName(EdgeNGramTokenFilterV2.`@odata.type`, "odataType");
@@clientName(ElisionTokenFilter.`@odata.type`, "odataType");
@@clientName(KeepTokenFilter.`@odata.type`, "odataType");
@@clientName(KeywordMarkerTokenFilter.`@odata.type`, "odataType");
@@clientName(LengthTokenFilter.`@odata.type`, "odataType");
@@clientName(LimitTokenFilter.`@odata.type`, "odataType");
@@clientName(NGramTokenFilter.`@odata.type`, "odataType");
@@clientName(NGramTokenFilterV2.`@odata.type`, "odataType");
@@clientName(PatternCaptureTokenFilter.`@odata.type`, "odataType");
@@clientName(PatternReplaceTokenFilter.`@odata.type`, "odataType");
@@clientName(PhoneticTokenFilter.`@odata.type`, "odataType");
@@clientName(ShingleTokenFilter.`@odata.type`, "odataType");
@@clientName(SnowballTokenFilter.`@odata.type`, "odataType");
@@clientName(StemmerTokenFilter.`@odata.type`, "odataType");
@@clientName(StemmerOverrideTokenFilter.`@odata.type`, "odataType");
@@clientName(StopwordsTokenFilter.`@odata.type`, "odataType");
@@clientName(SynonymTokenFilter.`@odata.type`, "odataType");
@@clientName(TruncateTokenFilter.`@odata.type`, "odataType");
@@clientName(UniqueTokenFilter.`@odata.type`, "odataType");
@@clientName(WordDelimiterTokenFilter.`@odata.type`, "odataType");
@@clientName(MappingCharFilter.`@odata.type`, "odataType");
@@clientName(PatternReplaceCharFilter.`@odata.type`, "odataType");
@@clientName(ClassicSimilarityAlgorithm.`@odata.type`, "odataType");
@@clientName(BM25SimilarityAlgorithm.`@odata.type`, "odataType");
@@clientName(SearchIndexerDataIdentity.`@odata.type`, "odataType");
@@clientName(SearchIndexerDataNoneIdentity.`@odata.type`, "odataType");
@@clientName(SearchIndexerDataUserAssignedIdentity.`@odata.type`, "odataType");
@@clientName(HighWaterMarkChangeDetectionPolicy.`@odata.type`, "odataType");
@@clientName(SqlIntegratedChangeTrackingPolicy.`@odata.type`, "odataType");
@@clientName(SoftDeleteColumnDeletionDetectionPolicy.`@odata.type`,
  "odataType"
);
@@clientName(NativeBlobSoftDeleteDeletionDetectionPolicy.`@odata.type`,
  "odataType"
);
@@clientName(DefaultCognitiveServicesAccount.`@odata.type`, "odataType");
@@clientName(CognitiveServicesAccountKey.`@odata.type`, "odataType");
@@clientName(AIServicesAccountKey.`@odata.type`, "odataType");
@@clientName(AIServicesAccountIdentity.`@odata.type`, "odataType");
@@clientName(ConditionalSkill.`@odata.type`, "odataType");
@@clientName(KeyPhraseExtractionSkill.`@odata.type`, "odataType");
@@clientName(OcrSkill.`@odata.type`, "odataType");
@@clientName(ImageAnalysisSkill.`@odata.type`, "odataType");
@@clientName(LanguageDetectionSkill.`@odata.type`, "odataType");
@@clientName(ShaperSkill.`@odata.type`, "odataType");
@@clientName(MergeSkill.`@odata.type`, "odataType");
@@clientName(EntityRecognitionSkill.`@odata.type`, "odataType");
@@clientName(SentimentSkill.`@odata.type`, "odataType");
@@clientName(SentimentSkillV3.`@odata.type`, "odataType");
@@clientName(EntityLinkingSkill.`@odata.type`, "odataType");
@@clientName(EntityRecognitionSkillV3.`@odata.type`, "odataType");
@@clientName(EntityRecognitionSkill.`@odata.type`, "odataType");
@@clientName(PIIDetectionSkill.`@odata.type`, "odataType");
@@clientName(SplitSkill.`@odata.type`, "odataType");
@@clientName(CustomEntityLookupSkill.`@odata.type`, "odataType");
@@clientName(TextTranslationSkill.`@odata.type`, "odataType");
@@clientName(DocumentExtractionSkill.`@odata.type`, "odataType");
@@clientName(DocumentIntelligenceLayoutSkill.`@odata.type`, "odataType");
@@clientName(WebApiSkill.`@odata.type`, "odataType");
@@clientName(AzureMachineLearningSkill.`@odata.type`, "odataType");
@@clientName(AzureOpenAIEmbeddingSkill.`@odata.type`, "odataType");
@@clientName(VisionVectorizeSkill.`@odata.type`, "odataType");
@@clientName(PathHierarchyTokenizerV2.`@odata.type`, "odataType");
