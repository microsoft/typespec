TypeSpec 1.0 preview release planning
Questions or comments? @marioguerra
Contents
Abstract 2
Introduction 3
The case for TypeSpec 3
TypeSpec and third-party developers 3
The Need for a 1.0 Release 4
Internal Azure Teams 4
• Transition Complexity: Internal Azure teams, particularly those managing brownfield services, are concerned about the complexity of transitioning to TypeSpec and its impact on developer workflows. 4
• Tooling and Automation: There are questions about the availability and integration of tooling for TypeSpec to support API development and ensure compatibility. 4
• Validation and Verification: Teams need assurance that the transition to TypeSpec will not disrupt existing services or SDKs, with a focus on maintaining compatibility and correctness. 4
• Assurance of Stability: Achieving a 1.0 release would signal that the core language and tooling are stable, significantly reducing the risk of breaking changes. This milestone would provide the confidence needed for internal teams to adopt TypeSpec without fearing excessive churn. 4
External Customers 4
Current status 5
Metrics 5
1.0 preview release – what’s in the box? 6
TypeSpec enhancements 7
Emitter framework and protocol support 7
Tooling 7
Protocol emitters 7
Client and service emitters 7
Tooling 8
Release timeline 8
User scenarios 9
Customer engagement 10
Microsoft 10
London Stock Exchange Group 10
Morgan Stanley 10
Pinterest 11
Future roadmap 11
Potential post-1.0 developments 11
Non-Goals for 1.0 11
Further reading 12
API First 12
The strategic value of TypeSpec for Azure 12
Emitter framework evaluation 12

Abstract
The TypeSpec team is focused on delivering a modern API definition language that meets the evolving needs of API developers, architects, and managers. For the 1.0 release candidate, we plan to provide the ability to generate client SDKs in C#, Java, JavaScript, and Python, and backend server code in C# and JavaScript. We also plan to deliver support for compilation to several common protocols, including OpenAPI 3.0/3.1, JSON Schema, Protobuf, and GraphQL.
Our roadmap includes improving our documentation and examples, extending backend server code generation to Python and Java, and exploring automatic unit test generation. For 1P (Azure), all Azure greenfield services are required to deploy using TypeSpec, and we are rolling out a plan for converting brownfield services. For 3P, our collaborations with the London Stock Exchange Group, Morgan Stanley, and Pinterest underscore the real-world applicability and benefits of TypeSpec, extending its impact beyond Microsoft.
We are also evaluating a replacement framework for our current emitter framework to further streamline development and improve flexibility. Additionally, we are fostering a community around TypeSpec to encourage contributions and share best practices, further extending its reach and utility.
A 1.0 release of TypeSpec communicates a stable, mature language with minimal risk of breaking changes to customers. This stability is critical for both internal and external adoption, especially as we transition brownfield Azure services to TypeSpec.

---

Introduction
The case for TypeSpec
Official Docs | Try TypeSpec Online | Getting Started | Language Overview
Over the past few years, TypeSpec has been developed to meet the evolving needs of API developers, architects, and managers. In an environment where delivering high-quality APIs is increasingly complex and critical, Azure needs a solution that ensures consistency, reduces errors, and accelerates development. TypeSpec addresses these challenges by providing a platform that enables abstraction, encourages code reuse, and leverages modern tooling for rapid development. It is designed to be easier to author, faster to review, and simpler to maintain.
One of the key issues in API development is the historical tendency to treat API definitions as an afterthought, leading to inconsistencies and misalignments between the API and the service implementation. This results in higher maintenance costs and lower API quality. Azure needed a solution that ensures the API specification is the single source of truth, keeping all related artifacts in sync. TypeSpec addresses this by significantly reducing discrepancies and improving overall API quality.
Additionally, TypeSpec supports the API-First design methodology, which emphasizes designing APIs upfront based on user needs. For more information on API-First, please refer to this supplemental document.
TypeSpec allows the creation of reusable patterns for all aspects of an API, which can be packaged into libraries. We have created TypeSpec libraries for Azure services to use in defining their APIs, embedding all current Azure API guidelines. By using these libraries, services automatically adhere to Azure standards, simplifying the process of building service APIs, passing API reviews, and producing high-quality SDKs. Additionally, TypeSpec features a rich linter framework to flag anti-patterns and an emitter framework to control output, ensuring it follows desired patterns.
The compact nature of TypeSpec, combined with its familiar JavaScript-style syntax, allows even non-technical stakeholders to participate in the API review and design process. This inclusivity ensures that APIs are designed with a broader perspective, incorporating insights from various roles within the organization, and ultimately leading to more user-centric and well-rounded API designs.
For a more detailed discussion of the strategic value of TypeSpec for Azure, refer to this supplemental document.
TypeSpec and third-party developers
TypeSpec is a key component of Microsoft's API suite, designed to streamline API design, deployment, and governance. By making TypeSpec available to third parties, we aim to establish ourselves as leaders in the API design space, influencing customers to consider Microsoft for hosting their services.
TypeSpec simplifies API development by providing a single source of truth, ensuring consistency, and reducing errors. This makes it easier for developers to build, manage, and deploy APIs efficiently. When developers experience the benefits of TypeSpec, they recognize Microsoft's commitment to innovation and excellence in API design.
Microsoft's API ecosystem which includes Azure API Management, Azure API Center, Playwright, and Azure Load Testing, complements TypeSpec by offering unified management, governance checks, automated testing, and performance assurance. As we explore deeper integration with these products and services, the potential for a cohesive and efficient development experience that attracts users to our suite of paid products increases.
Expanding TypeSpec to third parties aligns with Microsoft's vision of promoting an API-first methodology and establishing leadership in the API space, encouraging developers to choose Azure for its comprehensive and efficient API solutions.
The Need for a 1.0 Release
The TypeSpec team has observed that both internal Azure teams and external customers frequently inquire about the stability and roadmap of TypeSpec. These stakeholders are interested in adopting TypeSpec but are hesitant to use a product that has not yet reached a stable release.
Internal Azure Teams
• Transition Complexity: Internal Azure teams, particularly those managing brownfield services, are concerned about the complexity of transitioning to TypeSpec and its impact on developer workflows.
• Tooling and Automation: There are questions about the availability and integration of tooling for TypeSpec to support API development and ensure compatibility.
• Validation and Verification: Teams need assurance that the transition to TypeSpec will not disrupt existing services or SDKs, with a focus on maintaining compatibility and correctness.
• Assurance of Stability: Achieving a 1.0 release would signal that the core language and tooling are stable, significantly reducing the risk of breaking changes. This milestone would provide the confidence needed for internal teams to adopt TypeSpec without fearing excessive churn.
External Customers
• Stability Concerns: External customers, such as those from Pinterest and discussions on the TypeSpec Discord channel, often question how stable TypeSpec is and what the future plans are.
• Version Perception: Many third parties interpret a 1.0 release as a sign of stability and readiness for production use. The current version (0.64 as of this writing) raises doubts about the product's maturity.
• Adoption Hesitation: There is a segment of potential users who are not adopting TypeSpec because it has not yet been labeled as stable.
• Importance of Clear Messaging: Clearly communicating the stability and commitment to TypeSpec through a 1.0 release can encourage adoption, particularly among larger customers.
By addressing these concerns and moving towards a 1.0 release, we can provide the confidence needed for both internal Azure teams and third parties to adopt TypeSpec.

---

Current status
TypeSpec is now required for defining APIs in all new Azure greenfield services, and we have a plan for converting brownfield services to TypeSpec over the next three years. A TypeSpec Conversion Tool (TCT) that converts an existing OpenAPI spec to TypeSpec has been usable since late 2023, but some manual work is still required post-conversion. Efforts are ongoing to improve the TCT to reduce the amount of manual effort required. While we aim for 80-90% conversion, some manual intervention will still be necessary due to the complexity and differences between brownfield services.
Additionally, we are working to facilitate the verification of converted specs by teams and review boards by defining common standards for TypeSpec code written for Azure services.
For third-party (3P) scenarios, TypeSpec is being adopted by several external organizations, including the London Stock Exchange Group, Morgan Stanley, and Pinterest. These collaborations underscore the real-world applicability and benefits of TypeSpec, extending its impact beyond Microsoft.
Community activity around TypeSpec is growing, with developers experimenting with database adapters, bindings for front-end frameworks, and early work in CLI code generation. We are also fostering a community around TypeSpec to encourage contributions and share best practices, further extending its reach and utility.
Additionally, we have extensions for Visual Studio and VS Code that aid in efficient TypeSpec creation, providing popular features like syntax highlighting and IntelliSense.
A 1.0 release of TypeSpec will mark a significant milestone, ensuring a stable and mature language with minimal risk of breaking changes. This stability is crucial for both internal and external adoption, particularly as we transition brownfield services to TypeSpec. Achieving the 1.0 release signals our confidence in the language's stability, which should reassure teams that they can transition now without concerns about excessive churn in the language and tooling.
Metrics
To evaluate the adoption and impact of TypeSpec, we monitor several key metrics. Currently, our focus is primarily on first-party (1P) metrics, but we are ensuring that we do not block future third-party (3P) metrics.
Adoption Tracking (Quantitative, 1P)
We track TypeSpec adoption by Azure services through data analysis of releases in the Azure REST API specs repositories. This information is available in a Power BI dashboard, which provides a high-level summary showing the percentage of Azure services that have adopted TypeSpec. The dashboard also includes views that allow users to dive deeper into the data for more detailed insights.
Social Proofs (Qualitative, 1P and future 3P)
We monitor social media platforms to gather feedback and gauge the sentiment of the developer community regarding TypeSpec. Initially, our focus is on internal platforms such as the internal Stack Overflow used by ARM. For future 3P scenarios, we plan to monitor platforms like StackOverflow, YouTube, Reddit, and others. Positive and negative mentions, testimonials, and discussions help us understand the impact and reception of TypeSpec in the broader community.
Download Counts (Quantitative, 1P and future 3P)
We track the download counts of TypeSpec packages on NPM to measure the interest and usage among developers. While high download counts indicate strong interest, they don’t necessarily correlate with strong adoption. This metric helps us gauge the initial curiosity and engagement with TypeSpec.  
Extension Usage (Quantitative, 1P and future 3P)
We monitor the download counts and usage statistics of the TypeSpec extensions for Visual Studio and VS Code. Detailed metrics can be found at Extension Insights.
These metrics help us understand how developers interact with the extensions. It is crucial to differentiate between the feedback on TypeSpec itself and the extensions, as developers may have different experiences with each.  
Survey Responses (Qualitative, 1P)
We collect survey responses from Azure service partners who have gone through the process of defining and deploying a new service using TypeSpec. These surveys gather qualitative data on their experiences, challenges, and satisfaction with TypeSpec.
Website Analytics (Quantitative, 3P)
We track website analytics for typespec.io to monitor traffic, user engagement, and other key metrics. This helps us understand how developers are interacting with our online resources and identify opportunities for improving the website experience.

---

1.0 preview release – what’s in the box?
For the 1.0 preview release, we will focus primarily on the core language and tooling, along with the adoption of the Alloy emitter framework (pending the investigation outcome, details provided below). We will deliver a comprehensive customer experience that includes the following features:
TypeSpec enhancements
• Streaming: Enable APIs to produce data over time through persistent connections, supporting real-time processing and consumption for AI applications.
• Events/Messaging: Support event-based APIs, allowing services to publish events and clients to subscribe, facilitating reactive systems.
• Versioning: Rework our support for versioning services to be more user-friendly and intuitive.
Both of these enhancements are necessary to support code generation for the Microsoft AI Chat Protocol, which we’ve identified as a user scenario we intend to support for 1.0 preview. The user scenarios we intend to support are listed in their own section later in this document.
Emitter framework and protocol support
An emitter in TypeSpec is a tool that converts API specifications written in TypeSpec into various output formats, such as documentation, client libraries, or server code. Emitters can be customized to fit specific project needs and integrated into development workflows for continuous generation of API artifacts.
TypeSpec provides an emitter framework to generate various API specifications, client SDKs, and backend server code. To further streamline emitter development and improve flexibility, we are evaluating the Alloy project as a potential replacement for the current v1 emitter framework. For more information on the evaluation, refer to this supplemental document.
We currently provide client emitters for data-plane and management-plane client generation for use by Azure teams. We do not intend to move these to Alloy as part of the 1.0 release, since they are stable and well tested at this point.
Tooling
• Enhance the Azure-specific OpenAPI 2.0 TypeSpec Conversion Tool (TCT) to facilitate the conversion process and verification of converted brownfield specs.
• VS/VSCode extensions promoted from current preview releases to 1.0
Protocol emitters
In our 1.0 preview release, we intend to support a variety of protocol emitters at preview quality. These emitters will enable developers to generate specifications and code that adhere to widely accepted protocols, enhancing interoperability and ease of use. The following protocol emitters are planned:
• OpenAPI 3.x
• JSON Schema
• Protobuf
• GraphQL
• JSON RPC
Client and service emitters
We will support the generation of SDKs for interacting with APIs and backend server code stubs for defined APIs, allowing developers to focus on business logic. The supported languages for both client and service emitters will be C# and JavaScript, with Java, Python, Go, and Rust as stretch goals for client emitters.
In this context, we are specifically referring to the non-branded (i.e. non-Azure) emitters for C# and JavaScript. Existing emitters for Azure DPG and MPG will remain unchanged.
• JavaScript:
o TypeSpec is a natural fit in the JavaScript environment. Our language is written in TypeScript, distributed with NPM (the JavaScript package manager), and extensions are authored in TypeScript. Additionally, JavaScript is a dominant language in the API space, and JavaScript developers are abundant, making it easier to find talent and support.
• C#:
o There is significant demand for C# support from both internal and external stakeholders. Supporting C# allows us to leverage partnerships with tools like Visual Studio and the .NET ecosystem, enhancing the overall developer experience and broadening our reach.
By consolidating our emitter framework and evaluating Alloy, we aim to enhance the developer experience and ensure TypeSpec remains a versatile and powerful tool for API development.
Tooling
• OpenAPI 3.x to TypeSpec Converter: Intended for third-party use to convert existing OpenAPI specifications to TypeSpec, aiming for an 80-90% conversion rate.
Release timeline
In preparation for a 1.0 preview release, our focus is on the readiness and classification of various components to ensure a stable and high-quality launch. The timeline is as follows:
• Language and tooling: Planned to reach 1.0 preview release quality (date TBD), reflecting a high level of confidence and stability.
• Emitter framework V2: Planned for 1.0 preview release quality, pending completion of the Alloy project feasibility study to confirm its readiness.
• Client and service code generation: Planned for 1.0 preview release quality to gather customer feedback.
• Other Protocol Emitters: Planned for 1.0 preview quality to gather customer feedback.
Our goal is to have these components ready by the end of March 2025.

```
graph TD
    A[Core TypeSpec Language and Tooling] --> B[Compiler, libraries, VS/VSCode extensions]
    B --> C[Internal Azure Use] --> D[Data Plane / Management Plane Client Emitters For:]
    D --> D1[C#]
    D --> D2[Java]
    D --> D3[JavaScript]
    D --> D4[Python]
    D --> D5[Go]
    B --> E[External Use] --> F[Client/Service Code Emitters For:]
    F --> F1[C#]
    F --> F2[JavaScript]
    E --> G[Protocol Emitters For:]
    G --> G1[OpenAPI 3.x]
    G --> G2[JSON Schema]
    G --> G3[Protobuf]
    G --> G4[GraphQL]
    G --> G5[JSON RPC]
```

User scenarios

Job to be Done: Enable developers to write their API specifications in TypeSpec and generate client and server code and/or data models from the spec.
TypeSpec enables developers to define their API structures and data models concisely and consistently, independent of the output protocol or use case. By using TypeSpec, developers can generate client and server code from a single source of truth. This unified approach simplifies the development process and ensures consistency across different parts of the application.
HTTP APIs (REST and Chat Protocol)
Use Cases: Web apps and AI chat applications using the Microsoft AI chat protocol.
Implementation: Developers can manage resources (e.g., products, orders, customers) or build AI chat interfaces that interact with users. TypeSpec generates OpenAPI specifications, client and server code, streamlining the development process.
GraphQL APIs
Use Case: Social media platform (e.g., Pinterest)
Implementation: Developers can fetch user profiles, pins, boards, comments, and likes in a single request. TypeSpec defines the GraphQL schema and resolvers, generating the necessary schema and server code to ensure the API is well-structured and easy to maintain. This helps to deliver a responsive and efficient user experience.
JSON Schema
Use Case: Data modeling
Implementation: Developers can generate JSON Schemas that drive IntelliSense in VS Code. TypeSpec defines the data models, generating JSON Schema definitions that enhance the development experience by providing accurate and helpful code completions.
By enabling developers to write their API specifications in TypeSpec and generate client and server code from the spec, we ensure a streamlined, consistent, and efficient API development process across various use cases. For data modeling scenarios, TypeSpec enhances the development experience by generating JSON Schemas that improve code completion and accuracy.

---

Customer engagement
Microsoft
Feedback from several Microsoft and Azure teams—Azure AI Content Safety, Azure Batch, Azure Quantum, MS Learn, and MS Graph—highlights both strengths and areas for improvement in TypeSpec. Teams generally found TypeSpec easier to learn and use compared to OpenAPI, with intuitive syntax and structure similar to C#. The core documentation and examples were helpful, and the playground feature facilitated learning and experimentation. Integration with VS Code and the ability to modularize and reuse components were well-received, streamlining workflows and improving overall API operations. TypeSpec’s strongly-typed nature and modularization capabilities reduced code duplication and enhanced maintainability.

However, challenges remain. Advanced features and non-typical scenarios posed difficulties, particularly for developers with less JavaScript or TypeScript experience. Documentation for non-standard operations and advanced scenarios needs enhancement, and better documentation of local validation tools is required. Issues with versioning, backend code generation, and the transition from OpenAPI to TypeSpec were noted, along with the need for more robust server-side generation and tooling.
London Stock Exchange Group
LSEG struggled with integrating multiple APIs from different design schemas, which affected customer experience and workflow integration. They turned to TypeSpec for consistency and efficiency in API and SDK development. TypeSpec templates ensure a uniform design, reducing repetitive tasks and errors.
By minimizing the code needed for API specifications, TypeSpec allows designers to focus on critical tasks and accelerate development. Additionally, TypeSpec auto-generates easy-to-use SDKs, simplifying API interactions and reducing release time while maintaining functional parity.******************\_\_\_\_******************
Morgan Stanley
Morgan Stanley uses TypeSpec to build a data quality and validation pipeline for data analysts, focusing on data shapes without operations. They developed a custom vocabulary for flagging PII and MNPI, and created custom emitters for Python, Java, and Scala.
They also built a customized playground for analysts to enter requirements, generate TypeSpec definitions, download classes, or run data validation. They have approximately 10,000 lines of TypeSpec code.

---

Pinterest
Pinterest has expressed interest in developing a GraphQL emitter to expand TypeSpec’s capabilities. The TypeSpec team has been communicating with Pinterest, discussing the progress on building a basic prototype and coordinating with internal stakeholders on their requirements.
Pinterest has been working on incrementally adopting GraphQL and Relay, acknowledging the challenges of migrating at scale and designing Relay-compatible APIs that allow for incremental migration from REST to GraphQL. They plan to release their approach to open source to make adopting GraphQL on the front-end easier.

---

Future roadmap
Potential post-1.0 developments
• Expand the range of supported languages for client SDKs and backend server code based on user feedback.
• Build out tooling infrastructure to support the entire API development lifecycle. More details can be found in this document.
• Foster a community around TypeSpec through the TypeSpec Discord channel and the upcoming 'TypeSpecHub,' similar to 'DefinitelyTyped' for TypeScript. Engage on social media platforms like X, LinkedIn, and Reddit to build a robust ecosystem for collaboration.
• Collaborate with API Center, a Microsoft platform for discovering and consuming APIs, to integrate TypeSpec for API governance, conformance, and development.
Non-Goals for 1.0
Due to priorities and limited resources, the following items will not be included in the 1.0 release but are important for future consideration:
• Automatic Unit Test Generation: This feature will be explored in future updates.
• Automatic Documentation Generation: Generating documentation from TypeSpec specifications will be considered for future development.
• Backend Server Code Generation for Go and Rust: These languages will be evaluated based on user feedback post-1.0.
• Additional Protocol Emitters: Emitters for more protocols and serialization formats will be developed in future releases.
• Enhanced Linter Framework: Expanding the linter to cover more anti-patterns and best practices will be addressed in subsequent updates.
• Client customization for 3P – Allow third parties to customize specific language clients similar to how this is supported for Azure (client.tsp convention)
• One-Click DevOps Feature: Implementing a 'one-click' feature for generating SDKs, CLI/PSH, samples, and service-side code stubs will be considered for future development.
•

These non-goals reflect our focus on delivering a robust 1.0 release while acknowledging the importance of these features for future iterations.
Further reading
API First
So, what exactly is “API First” development?
The strategic value of TypeSpec for Azure
TypeSpec and Azure
Emitter framework evaluation
3rd party emitters story for TypeSpec
