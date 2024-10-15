import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for collectionFormat.")
@scenarioService("/parameters/collection-format")
namespace Parameters.CollectionFormat;

@route("/query")
namespace Query {
  @scenario
  @scenarioDoc("""
    This test is testing sending a multi collection format array query parameters
    """)
  @route("/multi")
  op multi(
    @doc("Possible values for colors are [blue,red,green]")
    @query(#{ explode: true })
    colors: string[],
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    This test is testing sending a ssv collection format array query parameters
    """)
  @route("/ssv")
  op ssv(
    #suppress "deprecated" "Deprecated in next release"
    @doc("Possible values for colors are [blue,red,green]")
    @query({
      format: "ssv",
    })
    colors: string[],
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    This test is testing sending a tsv collection format array query parameters
    """)
  @route("/tsv")
  op tsv(
    #suppress "deprecated" "Deprecated in next release"
    @doc("Possible values for colors are [blue,red,green]")
    @query({
      format: "tsv",
    })
    colors: string[],
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    This test is testing sending a pipes collection format array query parameters
    """)
  @route("/pipes")
  op pipes(
    #suppress "deprecated" "Deprecated in next release"
    @doc("Possible values for colors are [blue,red,green]")
    @query({
      format: "pipes",
    })
    colors: string[],
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    This test is testing sending a csv collection format array query parameters
    """)
  @route("/csv")
  op csv(
    @doc("Possible values for colors are [blue,red,green]")
    @query
    colors: string[],
  ): NoContentResponse;
}

@route("/header")
namespace Header {
  @scenario
  @scenarioDoc("""
    This test is testing sending a csv collection format array header parameters
    """)
  @route("/csv")
  op csv(
    @doc("Possible values for colors are [blue,red,green]")
    @header({
      format: "csv",
    })
    colors: string[],
  ): NoContentResponse;
}
