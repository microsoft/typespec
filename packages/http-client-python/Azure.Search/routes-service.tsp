import "@azure-tools/typespec-azure-core";
import "@typespec/rest";
import "./models-service.tsp";

using TypeSpec.Rest;
using TypeSpec.Http;
using TypeSpec.Versioning;

namespace Search;

interface DataSourcesOperations {
  /**
   * Creates a new datasource or updates a datasource if it already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/datasources('{dataSourceName}')")
  @put
  createOrUpdate is SearchDataSourceOperation<
    {
      ...matchingHeader;
      ...preferHeader;

      /**
       * Ignores cache reset requirements.
       */
      @added(Versions.v2024_11_01_preview)
      @query("ignoreResetRequirements")
      skipIndexerResetRequirementForCache?: boolean;

      /**
       * The definition of the datasource to create or update.
       */
      @body
      dataSource: SearchIndexerDataSource;
    },
    SearchIndexerDataSource & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes a datasource.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/datasources('{dataSourceName}')")
  @delete
  delete is SearchDataSourceOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves a datasource definition.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/datasources('{dataSourceName}')")
  @get
  get is SearchDataSourceOperation<{}, SearchIndexerDataSource>;

  /**
   * Lists all datasources available for a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/datasources")
  @get
  list is SearchOperation<selectQuery, ListDataSourcesResult>;

  /**
   * Creates a new datasource.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/datasources")
  @post
  create is SearchOperation<
    {
      /**
       * The definition of the datasource to create.
       */
      @body
      dataSource: SearchIndexerDataSource;
    },
    SearchIndexerDataSource & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;
}

interface IndexersOperations {
  /**
   * Resets the change tracking state associated with an indexer.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexers('{indexerName}')/search.reset")
  @post
  reset is SearchIndexerOperation<
    {},
    {
      @doc("A process exit code.")
      @statusCode
      code: "204";
    }
  >;

  /**
   * Resets specific documents in the datasource to be selectively re-ingested by
   * the indexer.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @added(Versions.v2024_11_01_preview)
  @route("/indexers('{indexerName}')/search.resetdocs")
  @post
  resetDocs is SearchIndexerOperation<
    {
      /**
       * If false, keys or ids will be appended to existing ones. If true, only the keys
       * or ids in this payload will be queued to be re-ingested.
       */
      @query
      overwrite?: boolean;

      /**
       * The keys or ids of the documents to be re-ingested. If keys are provided, the
       * document key field must be specified in the indexer configuration. If ids are
       * provided, the document key field is ignored.
       */
      @body
      keysOrIds?: DocumentKeysOrIds;
    },
    {
      @doc("A process exit code.")
      @statusCode
      code: "204";
    }
  >;

  /**
   * Runs an indexer on-demand.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexers('{indexerName}')/search.run")
  @post
  run is SearchIndexerOperation<
    {},
    {
      @doc("A process exit code.")
      @statusCode
      code: "202";
    }
  >;

  /**
   * Creates a new indexer or updates an indexer if it already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexers('{indexerName}')")
  @put
  createOrUpdate is SearchIndexerOperation<
    {
      ...matchingHeader;
      ...preferHeader;

      /**
       * Ignores cache reset requirements.
       */
      @added(Versions.v2024_11_01_preview)
      @query("ignoreResetRequirements")
      skipIndexerResetRequirementForCache?: boolean;

      /**
       * Disables cache reprocessing change detection.
       */
      @added(Versions.v2024_11_01_preview)
      @query("disableCacheReprocessingChangeDetection")
      disableCacheReprocessingChangeDetection?: boolean;

      /**
       * The definition of the indexer to create or update.
       */
      @body
      indexer: SearchIndexer;
    },
    SearchIndexer & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes an indexer.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexers('{indexerName}')")
  @delete
  delete is SearchIndexerOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves an indexer definition.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexers('{indexerName}')")
  @get
  get is SearchIndexerOperation<{}, SearchIndexer>;

  /**
   * Lists all indexers available for a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexers")
  @get
  list is SearchOperation<selectQuery, ListIndexersResult>;

  /**
   * Creates a new indexer.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexers")
  @post
  create is SearchOperation<
    {
      /**
       * The definition of the indexer to create.
       */
      @body
      indexer: SearchIndexer;
    },
    SearchIndexer & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;

  /**
   * Returns the current status and execution history of an indexer.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexers('{indexerName}')/search.status")
  @get
  getStatus is SearchIndexerOperation<{}, SearchIndexerStatus>;
}

interface SkillsetsOperations {
  /**
   * Creates a new skillset in a search service or updates the skillset if it
   * already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/skillsets('{skillsetName}')")
  @put
  createOrUpdate is SearchSkillsetOperation<
    {
      ...matchingHeader;
      ...preferHeader;

      /**
       * Ignores cache reset requirements.
       */
      @added(Versions.v2024_11_01_preview)
      @query("ignoreResetRequirements")
      skipIndexerResetRequirementForCache?: boolean;

      /**
       * Disables cache reprocessing change detection.
       */
      @added(Versions.v2024_11_01_preview)
      @query("disableCacheReprocessingChangeDetection")
      disableCacheReprocessingChangeDetection?: boolean;

      /**
       * The skillset containing one or more skills to create or update in a search
       * service.
       */
      @body
      skillset: SearchIndexerSkillset;
    },
    SearchIndexerSkillset & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes a skillset in a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/skillsets('{skillsetName}')")
  @delete
  delete is SearchSkillsetOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves a skillset in a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/skillsets('{skillsetName}')")
  @get
  get is SearchSkillsetOperation<{}, SearchIndexerSkillset>;

  /**
   * List all skillsets in a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/skillsets")
  @get
  list is SearchOperation<selectQuery, ListSkillsetsResult>;

  /**
   * Creates a new skillset in a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/skillsets")
  @post
  create is SearchOperation<
    {
      /**
       * The skillset containing one or more skills to create in a search service.
       */
      @body
      skillset: SearchIndexerSkillset;
    },
    SearchIndexerSkillset & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;

  /**
   * Reset an existing skillset in a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @added(Versions.v2024_11_01_preview)
  @route("/skillsets('{skillsetName}')/search.resetskills")
  @post
  resetSkills is SearchSkillsetOperation<
    {
      /**
       * The names of the skills to reset. If not specified, all skills in the skillset
       * will be reset.
       */
      @body
      skillNames: SkillNames;
    },
    void
  >;
}

interface SynonymMapsOperations {
  /**
   * Creates a new synonym map or updates a synonym map if it already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/synonymmaps('{synonymMapName}')")
  @put
  createOrUpdate is SearchSynonymMapOperation<
    {
      ...matchingHeader;
      ...preferHeader;

      /**
       * The definition of the synonym map to create or update.
       */
      @body
      synonymMap: SynonymMap;
    },
    SynonymMap & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes a synonym map.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/synonymmaps('{synonymMapName}')")
  @delete
  delete is SearchSynonymMapOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves a synonym map definition.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/synonymmaps('{synonymMapName}')")
  @get
  get is SearchSynonymMapOperation<{}, SynonymMap>;

  /**
   * Lists all synonym maps available for a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/synonymmaps")
  @get
  list is SearchOperation<selectQuery, ListSynonymMapsResult>;

  /**
   * Creates a new synonym map.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/synonymmaps")
  @post
  create is SearchOperation<
    {
      /**
       * The definition of the synonym map to create.
       */
      @body
      synonymMap: SynonymMap;
    },
    SynonymMap & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;
}

interface IndexesOperations {
  /**
   * Creates a new search index.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexes")
  @post
  create is SearchOperation<
    {
      /**
       * The definition of the index to create.
       */
      @body
      index: SearchIndex;
    },
    SearchIndex & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;

  /**
   * Lists all indexes available for a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexes")
  @get
  list is SearchOperation<selectQuery, ListIndexesResult>;

  /**
   * Creates a new search index or updates an index if it already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/indexes('{indexName}')")
  @put
  createOrUpdate is SearchIndexOperation<
    {
      ...matchingHeader;

      /**
       * Allows new analyzers, tokenizers, token filters, or char filters to be added to
       * an index by taking the index offline for at least a few seconds. This
       * temporarily causes indexing and query requests to fail. Performance and write
       * availability of the index can be impaired for several minutes after the index
       * is updated, or longer for very large indexes.
       */
      @query
      allowIndexDowntime?: boolean;

      ...preferHeader;

      /**
       * The definition of the index to create or update.
       */
      @body
      index: SearchIndex;
    },
    SearchIndex & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes a search index and all the documents it contains. This operation is
   * permanent, with no recovery option. Make sure you have a master copy of your
   * index definition, data ingestion code, and a backup of the primary data source
   * in case you need to re-build the index.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexes('{indexName}')")
  @delete
  delete is SearchIndexOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves an index definition.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexes('{indexName}')")
  @get
  get is SearchIndexOperation<{}, SearchIndex>;

  /**
   * Returns statistics for the given index, including a document count and storage
   * usage.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexes('{indexName}')/search.stats")
  @get
  getStatistics is SearchIndexOperation<{}, GetIndexStatisticsResult>;

  /**
   * Shows how an analyzer breaks text into tokens.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/indexes('{indexName}')/search.analyze")
  @post
  analyze is SearchIndexOperation<
    {
      /**
       * The text and analyzer or analysis components to test.
       */
      @body
      request: AnalyzeRequest;
    },
    AnalyzeResult
  >;
}

@added(Versions.v2024_11_01_preview)
interface AliasesOperations {
  /**
   * Creates a new search alias.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/aliases")
  @post
  create is SearchOperation<
    {
      /**
       * The definition of the alias to create.
       */
      @body
      `alias`: SearchAlias;
    },
    SearchAlias & {
      @doc("A process exit code.")
      @statusCode
      code: "201";
    }
  >;
  /**
   * Lists all aliases available for a search service.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/aliases")
  @get
  list is SearchOperation<{}, ListAliasesResult>;

  /**
   * Creates a new search alias or updates an alias if it already exists.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  #suppress "@azure-tools/typespec-azure-core/use-standard-names" "Pre-existing API contract"
  @route("/aliases('{aliasName}')")
  @put
  createOrUpdate is SearchAliasOperation<
    {
      ...matchingHeader;
      ...preferHeader;

      /**
       * The definition of the alias to create or update.
       */
      @body
      `alias`: SearchAlias;
    },
    SearchAlias & {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "200" | "201";
    }
  >;

  /**
   * Deletes a search alias and its associated mapping to an index. This operation
   * is permanent, with no recovery option. The mapped index is untouched by this
   * operation.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/aliases('{aliasName}')")
  @delete
  delete is SearchAliasOperation<
    {
      ...matchingHeader;
    },
    {
      #suppress "@azure-tools/typespec-azure-core/no-closed-literal-union" "return status code"
      @doc("A process exit code.")
      @statusCode
      code: "204" | "404";
    }
  >;

  /**
   * Retrieves an alias definition.
   */
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
  @route("/aliases('{aliasName}')")
  @get
  get is SearchAliasOperation<{}, SearchAlias>;
}

/**
 * Gets service level statistics for a search service.
 */
#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Pre-existing API contract"
@route("/servicestats")
@get
op getServiceStatistics is SearchOperation<{}, SearchServiceStatistics>;
