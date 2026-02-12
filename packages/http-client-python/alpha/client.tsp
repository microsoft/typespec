import "@typespec/http";

   using TypeSpec.Http;

   @service(#{ title: "My Service" })
   namespace MyService;

   model Widget {
     id: string;
     name: string;
   }

   @route("/widgets")
   interface Widgets {
     @get list(): Widget[];
     @get read(@path id: string): Widget;
     @post create(@body widget: Widget): Widget;
   }
