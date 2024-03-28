import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Versioning;
using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Azure.Core;

@service({title: "Spread"})
@versioned(QueryApiVersion)
@doc("This is a spread model or alias service.")
@server(
    "{spreadUrl}",
    "Endpoint Service",
    {
        spreadUrl: string,
    }
)

namespace SpreadTypeSpec;

enum QueryApiVersion {
  v2022_01_01_preview: "2022-01-01-preview"
}

model Thing {
  @doc("name of the Thing")
  name: string;
  @doc("age of the Thing")
  age: int32;
}

alias ThingAlias = {
  @doc("name of the Thing")
  name: string;
  @doc("age of the Thing")
  age: int32;
};

alias ThingAliasWithModel = {
  @path id: string;
  ...Thing;
  @header top: int32;
};

alias ThingMultiTargetAlias = {
  @path id: string;
  @doc("name of the Thing")
  name: string;
  @doc("age of the Thing")
  age: int32;
  @header top: int32;
};

alias ThingAliasWithSpreadAlias = {
  @path id: string;
  ...ThingAlias;
  @header top: int32;
};

alias ThingAliasWithOptionalProps = {
  @path id: string;
  @doc("name of the Thing")
  name: string;
  @doc("optional property of the Thing")
  color?: string;
  @doc("age of the Thing")
  age?: int32;
  @header top: int32;
  @doc("required array")
  items: int32[];
  @doc("optional array")
  elements?: string[];
};

alias AliasWithRequiredAndOptionalCollections = {
  @doc("required list")
  requiredStringList: string[];
  @doc("optional list")
  optionalStringList?: string[];
};

@route("/spreadModel")
@doc("spread a model as body.")
@post
@convenientAPI(true)
op spreadModel( ...Thing ): void;

@route("/spreadAlias")
@doc("spread an alias as body.")
@post
@convenientAPI(true)
op spreadAlias( ...ThingAlias ): void;

@route("/spreadMultiTargetAlias")
@doc("spread an alias which has multiple target property as body.")
@post
@convenientAPI(true)
op spreadMultiTargetAlias( ...ThingMultiTargetAlias ): void;

@route("/spreadAliasWithModel")
@doc("spread an alias which contains a complex model property as body.")
@post
@convenientAPI(true)
op spreadAliasWithModel( ...ThingAliasWithModel ): void;

@route("/spreadAliasWithSpreadAlias")
@doc("spread an alias with contains another alias property as body.")
@post
@convenientAPI(true)
op spreadAliasWithSpreadAlias( ...ThingAliasWithSpreadAlias ): void;

@route("/spreadAliasWithOptionalProps")
@doc("spread an alias with contains optional properties as body.")
@post
@convenientAPI(true)
op spreadAliasWithOptionalProps( ...ThingAliasWithOptionalProps ): void;

@route("/spreadAliasWithCollections")
@doc("spread an alias with required and optional collections")
@post
@convenientAPI(true)
op spreadAliasWithCollections( ...AliasWithRequiredAndOptionalCollections ): void;
