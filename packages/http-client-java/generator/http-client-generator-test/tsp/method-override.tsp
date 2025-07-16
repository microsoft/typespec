import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using global.Azure.Core.Foundations;
using Azure.ClientGenerator.Core;
using TypeSpec.Http;
using TypeSpec.Versioning;

@service(#{ title: "MethodOverride" })
@versioned(Versions)
namespace TspTest.MethodOverride {
  enum Versions {
    @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
    v2022_12_01_preview: "2022-12-01-preview",
  }

  model GroupQueryOptions {
    @query foo?: string;
    @query bar?: string;
  }

  @get
  @route("/group-query")
  op groupQuery is global.Azure.Core.RpcOperation<GroupQueryOptions, {}>;

  model GroupAllOptions {
    @query foo?: string;
    @query bar?: string;
    prop1: string;
    prop2?: string;
  }

  @post
  @route("/group-all")
  op groupAll is global.Azure.Core.RpcOperation<GroupAllOptions, {}>;

  alias GroupPartNotGrouped = {
    @query foo?: string;
    prop1: string;
  };

  model GroupPartOptions {
    @query bar?: string;
    prop2?: string;
  }

  @post
  @route("/group-part")
  op groupPart is global.Azure.Core.RpcOperation<GroupPartNotGrouped & GroupPartOptions, {}>;

  model GroupPartETagOptions {
    ...GroupPartOptions;

    @header("If-Modified-Since")
    ifModifiedSince?: utcDateTime;

    @header("If-Unmodified-Since")
    ifUnmodifiedSince?: utcDateTime;

    @header("If-Match")
    ifMatch?: string;

    @header("If-None-Match")
    ifNoneMatch?: string;
  }

  @post
  @route("/group-part-etag")
  op groupPartETag is global.Azure.Core.RpcOperation<
    GroupPartNotGrouped & GroupPartETagOptions,
    {}
  >;

  model GroupExcludeBodyModel {
    prop1: string;
    prop2?: string;
  }

  alias GroupExcludeBody = {
    @body body: GroupExcludeBodyModel;
  };

  @post
  @route("/group-exclude-body")
  op groupExcludeBody is global.Azure.Core.RpcOperation<GroupExcludeBody & GroupQueryOptions, {}>;

  alias GroupNoneNotGrouped = {
    @query foo?: string;
    @header bar?: string;
    prop1: string;
    prop2?: string;
    prop3?: string;
    prop4?: string;
    prop5?: string;
    prop6?: string;
  };

  @post
  @route("/group-none")
  op groupNone is global.Azure.Core.RpcOperation<GroupNoneNotGrouped, {}>;
}

// customization in client.tsp
namespace Customization {
  op groupQueryCustomization(
    options?: TspTest.MethodOverride.GroupQueryOptions,
    ...ApiVersionParameter,
  ): void;
  op groupAllCustomization(
    options: TspTest.MethodOverride.GroupAllOptions,
    ...ApiVersionParameter,
  ): void;
  op groupPartCustomization(
    ...TspTest.MethodOverride.GroupPartNotGrouped,
    options?: TspTest.MethodOverride.GroupPartOptions,
    ...ApiVersionParameter,
  ): void;
  op groupPartETagCustomization(
    ...TspTest.MethodOverride.GroupPartNotGrouped,
    options?: TspTest.MethodOverride.GroupPartETagOptions,
    ...ApiVersionParameter,
  ): void;
  op groupExcludeBodyCustomization(
    ...TspTest.MethodOverride.GroupExcludeBody,
    options?: TspTest.MethodOverride.GroupQueryOptions,
    ...ApiVersionParameter,
  ): void;
  op groupNoneCustomization(
    ...TspTest.MethodOverride.GroupNoneNotGrouped,
    ...ApiVersionParameter,
  ): void;

  @@override(TspTest.MethodOverride.groupQuery, Customization.groupQueryCustomization);
  @@override(TspTest.MethodOverride.groupAll, Customization.groupAllCustomization);
  @@override(TspTest.MethodOverride.groupPart, Customization.groupPartCustomization);
  @@override(TspTest.MethodOverride.groupPartETag, Customization.groupPartETagCustomization);
  @@override(TspTest.MethodOverride.groupExcludeBody, Customization.groupExcludeBodyCustomization);
  @@override(TspTest.MethodOverride.groupNone, Customization.groupNoneCustomization);
}
