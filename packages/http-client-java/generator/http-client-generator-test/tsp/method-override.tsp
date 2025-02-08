import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using Azure.Core;
using global.Azure.Core.Traits;
using global.Azure.Core.Foundations;
using Azure.ClientGenerator.Core;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

@service({
  title: "MethodOverride",
})
@versioned(Versions)
namespace MethodOverride {
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

  model AllGroupOptions {
    @query foo?: string;
    @query bar?: string;
    prop1: string;
    prop2?: string;
  }

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
}

// customization in client.tsp
namespace Customization {
  op groupQueryCustomization(options?: MethodOverride.GroupQueryOptions, ...ApiVersionParameter): void;
  op groupAllCustomization(options: MethodOverride.GroupAllOptions, ...ApiVersionParameter): void;
  op groupPartCustomization(...MethodOverride.GroupPartNotGrouped, options?: MethodOverride.GroupPartOptions, ...ApiVersionParameter): void;
  op groupExcludeBodyCustomization(...MethodOverride.GroupExcludeBody, options?: MethodOverride.GroupQueryOptions, ...ApiVersionParameter): void;

  @@override(MethodOverride.groupQuery, Customization.groupQueryCustomization);
  @@override(MethodOverride.groupAll, Customization.groupAllCustomization);
  @@override(MethodOverride.groupPart, Customization.groupPartCustomization);
  @@override(MethodOverride.groupExcludeBody, Customization.groupExcludeBodyCustomization);
}
