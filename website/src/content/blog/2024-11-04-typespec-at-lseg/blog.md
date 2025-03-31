---
slug: 2024-11-04-typespec-at-lseg
title: "Enhancing API design at the London Stock Exchange Group"
image: ./tsp_lseg_360x360.png
description: In the fast-paced world of financial services, having consistent and efficient APIs and SDKs is crucial. At Microsoft, we’ve been working closely with LSEG (London Stock Exchange Group) to streamline their development process using TypeSpec. This collaboration has been very beneficial and educational for both sides, and we’re excited to share our insights with you.
publishDate: 2024-11-04
authors:
  - name: Mario Guerra
    title: Senior Product Manager @ Microsoft
    avatar: assets/img/authors/mario_guerra.png
  - name: Samuel Schwalm
    title: Director of Product Management @ LSEG
    avatar: assets/img/authors/default.png
  - name: Olivier Davant
    title: Product Manager @ LSEG
    avatar: assets/img/authors/default.png
---

<!-- cspell:ignore LSEG, lseg, Schwalm, Davant -->

## Introduction

In the fast-paced world of financial services, having consistent and efficient APIs and SDKs is crucial. At Microsoft, we’ve been working closely with LSEG (London Stock Exchange Group) to streamline their development process using TypeSpec. This collaboration has been very beneficial and educational for both sides, and we’re excited to share our insights with you.

<!-- truncate -->

## Background

LSEG faced the significant challenge of integrating multiple APIs derived from different design schemas. There are many reasons why an organization could find itself in a situation like this. For example, APIs may have been created at different times, by different teams, for different purposes like developing a user interface or delivering data as files, or they may have come from acquisitions.

This inconsistency made it tough for LSEG to provide APIs with a unified customer experience, and limited how customers could integrate them into their workflows. That’s when LSEG turned to TypeSpec, a new API design language created by Microsoft, with the intention of using TypeSpec to bring consistency and efficiency to their API and SDK development.

Our collaboration with LSEG began with initial discussions involving key individuals on both sides. LSEG's goal was to release a version of their APIs defined using TypeSpec, which would be used to generate OpenAPI specifications and SDKs in TypeScript and Python for use by internal and external customers.

## The TypeSpec Advantage

### Consistency Across APIs

TypeSpec has been a pivotal tool for LSEG in ensuring consistency across their APIs. In the past, maintaining consistency across OpenAPI specifications relied on error-prone copy/paste activities and cumbersome review sessions, rarely achieving complete success.

With TypeSpec, APIs can now be built with a uniform design using high-level templates, reducing the need for repetitive tasks and minimizing errors. This consistency is particularly important for LSEG, given the diverse origins of their APIs. TypeSpec acts as a single source of truth for API definitions, enhancing both consistency and quality.

### Efficiency and Speed

One of the most appreciated benefits of TypeSpec is the significant reduction in the amount of code needed to define API specifications. For LSEG, this means their API designers can focus on additional critical tasks, speeding up the development process.

With TypeSpec, a ten-line code snippet can generate a hundred lines of an OpenAPI specification, drastically reducing manual effort. This high-level abstraction simplifies API design with constructs similar to high-level languages, enhancing code organization. `.tsp` files are managed like TypeScript or C# source code, making the development process more efficient and easier to maintain.

### Enhanced Tooling

TypeSpec comes with advanced tools that catch errors early, leading to more robust APIs. This proactive error detection is crucial for maintaining high-quality API standards and reducing the time spent on debugging and revisions. Additionally, extensions for Visual Studio and VS Code aid in efficient TypeSpec creation, providing popular features like syntax highlighting and IntelliSense. These integrated tools further streamline the development process, making it easier for developers to write and maintain TypeSpec code.

### Accessibility

The compact nature of TypeSpec, combined with its familiar JavaScript-style syntax, allows even non-technical stakeholders to participate in the API review and design process. This inclusiveness ensures that APIs are designed with a broader perspective, incorporating insights from various roles within the organization, and ultimately leading to more user-centric and well-rounded API designs.

### High-Level SDK Generation

TypeSpec provides a pluggable generation architecture via "emitters," which can be used to provide customized output. LSEG partnered with the Industry Solutions Engineering (ISE) group at Microsoft to build a customized emitter specific to LSEG's requirements and needs.

The ISE software engineering team developed an emitter that allowed LSEG to auto-generate easy-to-use SDKs for different user types, including financial coders and data scientists. These SDKs are provided in TypeScript and Python, simplifying API interactions for their users.

This is particularly beneficial for LSEG’s diverse user base, which includes both seasoned developers and financial professionals who may not have extensive coding experience.

The auto-generation approach also greatly reduces the time required to release SDKs while ensuring functional parity of LSEG's APIs across environments. This efficiency not only speeds up development but also makes maintenance easier, contributing to a more streamlined and effective API lifecycle.

## Overcoming Challenges

### Namespaces and Versioning

While TypeSpec has been incredibly beneficial, LSEG faced challenges with namespaces and versioning decorators. These features are essential for preventing issues such as naming conflicts within LSEG's extensive API landscape. Unfortunately, existing emitters like AutoRest for Python and TypeScript do not consistently implement them. We are working closely with LSEG to address these issues.

### Embracing API-First

Moving to TypeSpec is more than a technology project. As part of this transition, LSEG has adopted an API-first development approach, making APIs a central part of their product strategy. This approach will ensure feature-parity between the native web APIs and the Python or TypeScript SDKs, while offering functionalities & workflows that are specific to the target environments, giving customers complete control and flexibility on how they use our APIs.

### Customer Insights

We anticipate valuable feedback from LSEG’s customers once they start using the new APIs and SDKs. This feedback will be instrumental in guiding future iterations and improvements. LSEG has released a first early access version of their TypeSpec-generated APIs in Q3 and is now engaging with users to collect feedback and plan subsequent iterations.

## The Path Forward

Looking ahead, we plan to enhance TypeSpec further, adding new features and addressing issues as they arise. Our goal is to continue improving the TypeSpec language and tooling, ensuring we provide the best possible experience for API developers.

## Conclusion

TypeSpec has been a transformative tool for LSEG, bringing consistency, efficiency, and user-friendliness to their API and SDK development. We’re excited to continue our collaboration and look forward to sharing more insights and updates in the future. By leveraging TypeSpec, LSEG has been able to streamline their development process, reduce manual effort, and provide a more consistent and user-friendly experience for their customers.

## About LSEG Microsoft Partnership

LSEG and Microsoft have launched a 10-year strategic partnership to co-develop next-generation data and analytics and cloud infrastructure solutions. Our partnership will accelerate value creation in financial markets and empower financial services organizations by offering interoperable, secure, and compliant solutions that will transform data, analytics, and workflow experiences. [Learn more about our strategic partnership.](https://www.lseg.com/en/microsoft-partnership)
