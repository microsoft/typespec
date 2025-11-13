import "@typespec/http";

using Http;

@service(#{ title: "Doc Service" })
namespace Azure.DocString;

model DocModel {
  @doc("""
    An array of tools the model may call while generating a response.
    You can specify which tool to use by setting the `tool_choice` parameter.
    
    The two categories of tools you can provide the model are:
    
    - **Built-in tools**: Tools that are provided by OpenAI that extend the model's capabilities, like file search.
    - **Function calls (custom tools)**: Functions that are defined by you, enabling the model to call your own code.
    """)
  doc1: string;

  @doc("""
    Specifies the processing type used for serving the request.
    * If set to 'auto', then the request will be processed with the service tier configured in the Project settings. Unless otherwise configured, the Project will use 'default'.
    * If set to 'default', then the request will be processed with the standard pricing and performance for the selected model.
    * If set to '[flex](https://platform.openai.com/docs/guides/flex-processing)' or 'priority', then the request will be processed with the corresponding service tier. [Contact sales](https://openai.com/contact-sales) to learn more about Priority processing.
    * When not set, the default behavior is 'auto'.
    
    When the `service_tier` parameter is set, the response body will include the `service_tier`
    value based on the processing mode actually used to serve the request. This response value
    may be different from the value set in the parameter.
    """)
  doc2: string;
}

@route("/docstring")
interface DocString {
  /** Get doc */
  @get get(): DocModel;
}
