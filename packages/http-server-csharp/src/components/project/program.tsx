import { type Children } from "@alloy-js/core";
import { CSharpFile } from "../csharp-file.jsx";

export interface ProgramCsProps {
  /** Whether to include Swagger UI middleware. */
  useSwaggerUI?: boolean;
  /** Path to the OpenAPI spec file. */
  openApiPath?: string;
  /** Whether mock registrations are included. */
  hasMocks?: boolean;
}

/**
 * Renders the Program.cs entry point for the ASP.NET service.
 */
export function ProgramCs(props: ProgramCsProps): Children {
  const useSwagger = props.useSwaggerUI ?? false;
  const openApiPath = props.openApiPath ?? "openapi/openapi.yaml";
  const hasMocks = props.hasMocks ?? false;

  const contents = `var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews(options =>
{
  options.Filters.Add<HttpServiceExceptionFilter>();
});
builder.Services.AddEndpointsApiExplorer();
${useSwagger ? "builder.Services.AddSwaggerGen();\n" : ""}${hasMocks ? "MockRegistration.Register(builder);\n" : ""}
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}
${
  useSwagger
    ? `else
{
    app.UseSwagger();
    app.UseSwaggerUI(c => {
    c.DocumentTitle = "TypeSpec Generated OpenAPI Viewer";
        c.SwaggerEndpoint("/openapi.yaml", "TypeSpec Generated OpenAPI Docs");
        c.RoutePrefix = "swagger";
    });
}
`
    : ""
}
app.UseHttpsRedirection();
app.UseStaticFiles();
app.Use(async (context, next) =>
{
    context.Request.EnableBuffering();
    await next();
});
${
  useSwagger
    ? `
app.MapGet("/openapi.yaml", async (HttpContext context) =>
{
    var externalFilePath = "${openApiPath}"; // Full path to the file outside the project
    if (!File.Exists(externalFilePath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsync("OpenAPI spec not found.");
        return;
    }
    context.Response.ContentType = "application/yaml";
    await context.Response.SendFileAsync(externalFilePath);
});
`
    : ""
}
app.UseRouting();

app.UseAuthorization();


app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");


app.Run();`;

  return (
    <CSharpFile path="Program.cs" using={["TypeSpec.Helpers"]}>
      {contents}
    </CSharpFile>
  );
}
