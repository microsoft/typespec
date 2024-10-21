---
slug: 2024-10-04-typespec-at-lseg
title: "Enhancing API design at the London Stock Exchange Group"
image: ./tsp_lseg.png
authors:
  - name: Mario Guerra
    title: Senior Product Manager
---

<!-- cspell:ignore LSEG, lseg, Schwalm, Davant -->

# Enhancing API design at the London Stock Exchange Group

## Introduction

In the fast-paced world of financial services, having consistent and efficient APIs and SDKs is crucial. At Microsoft, we’ve been working closely with LSEG (London Stock Exchange Group) to streamline their development process using TypeSpec. This collaboration has been very beneficial and educational for both sides, and we’re excited to share our insights with you.

<!-- truncate -->

## Background

LSEG faced the significant challenge of integrating multiple APIs derived from different design schemas. There are many reasons why an organization could find itself in a situation like this. For example, APIs may have been created at different times, by different teams, for different purposes like developing a user interface or delivering data as files, or they may have come from acquisitions.

This inconsistency made it tough for LSEG to provide APIs with a unified customer experience, and limited how customers could integrate them into their workflows. That’s when LSEG turned to TypeSpec, a new API design language created by Microsoft, with the intention of using TypeSpec to bring consistency and efficiency to their API and SDK development.

Our collaboration with LSEG began with initial discussions involving key individuals on both sides. LSEG's goal was to release a version of their APIs defined using TypeSpec, which would be used to generate OpenAPI specifications and SDKs in TypeScript and Python for use by internal and external customers.

## The TypeSpec Advantage

### Consistency Across APIs

TypeSpec has been a pivotal tool for LSEG in ensuring consistency across their APIs. In the past, consistency across OpenAPI specifications relied on error-prone copy / paste activities and cumbersome review sessions, rarely with complete success.

An API can now be built with a uniform design using TypeSpec templates, reducing the need for repetitive tasks and minimizing errors. This consistency is particularly important for LSEG, given the diverse origins of their APIs.

### Efficiency and Speed

One of the more appreciated benefits of TypeSpec is the significant reduction in the amount of code needed to define API specifications. For LSEG, this means their API designers can focus on additional critical tasks, speeding up the development process.

With TypeSpec, a ten-line code snippet can generate a hundred lines of an OpenAPI specification, drastically reducing manual effort.

### High-Level SDK Generation

TypeSpec enables LSEG to auto-generate easy-to-use SDKs for different user types, including financial coders and data scientists. LSEG has successfully generated SDKs in TypeScript and Python, simplifying API interactions for their users.

This is particularly beneficial for LSEG’s diverse user base, which includes both seasoned developers and financial professionals who may not have extensive coding experience.

The auto-generation also greatly reduces the time to release SDKs while ensuring functional parity of LSEG's APIs across environments.

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

## About the Authors

**Mario Guerra**  
Mario is a Senior Product Manager at Microsoft, focusing on API development with TypeSpec.

**Samuel Schwalm**  
Samuel is a Director of Product Management at LSEG, focusing on API design and integration.

**Olivier Davant**  
Olivier is a Project Manager at LSEG, overseeing the implementation of the Python and TypeScript SDKs.
