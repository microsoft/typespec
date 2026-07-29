// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel;

import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class ChangelogTests {

    private static final String CHANGELOG_LINE
        = "Provides operations for working with resources and resource groups. Package tag package-resources-2020-06. For documentation on how to use this package, please see [Azure Management Libraries for Java](https://aka.ms/azsdk/java/mgmt).";

    private static class MockProject extends FluentProject {

        public MockProject() {
            super("Resource", null, null);
        }

        @Override
        public String getServiceDescriptionForMarkdown() {
            return CHANGELOG_LINE;
        }

        @Override
        public String getVersion() {
            return "1.1.0-beta.1";
        }
    }

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @Test
    public void testChangelog() {
        FluentProject mockProject = new MockProject();
        String dateUtc = Changelog.getDateUtc();

        {
            Changelog changelog = new Changelog(mockProject);
            Assertions.assertTrue(changelog.getLines().contains(String.format("## 1.1.0-beta.1 (%s)", dateUtc)));
            Assertions.assertTrue(changelog.getLines()
                .stream()
                .anyMatch(
                    l -> l.equals("- Azure Resource Manager Resource client library for Java. " + CHANGELOG_LINE)));
        }

        {
            String existingChangelog = "# Release History\n" + "\n" + "## 1.0.1-beta.1 (Unreleased)\n" + "\n"
                + "- Added test cases.\n"
                + "- Azure Resource Manager Resource client library for Java. This package contains Microsoft Azure SDK for Resource Management SDK. Provides operations for working with resources and resource groups. Package tag package-resources-2020-06. For documentation on how to use this package, please see [Azure Management Libraries for Java](https://aka.ms/azsdk/java/mgmt)."
                + "\n" + "## 1.0.0 (2020-10-29)\n" + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(mockProject);

            Assertions.assertTrue(changelog.getLines().contains(String.format("## 1.1.0-beta.1 (%s)", dateUtc)));
            Assertions.assertTrue(changelog.getLines().contains("## 1.0.0 (2020-10-29)"));

            Assertions.assertFalse(changelog.getLines().contains("## 1.0.1-beta.1 (Unreleased)"));

            int previousChangelog = changelog.getLines().indexOf("- Added test cases.");
            int addedChangelog = changelog.getLines()
                .indexOf("- Azure Resource Manager Resource client library for Java. " + CHANGELOG_LINE);
            Assertions.assertTrue(previousChangelog > 0);
            Assertions.assertTrue(addedChangelog > 0);
            Assertions.assertEquals(previousChangelog - 1, addedChangelog);

            Assertions.assertTrue(changelog.getLines().contains("- Initial release."));
        }

        {
            String existingChangelog
                = "# Release History\n" + "\n" + "## 1.0.0 (2020-10-29)\n" + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(mockProject);

            Assertions.assertTrue(changelog.getLines().contains(String.format("## 1.1.0-beta.1 (%s)", dateUtc)));
            Assertions.assertTrue(changelog.getLines().contains("## 1.0.0 (2020-10-29)"));

            Assertions.assertTrue(changelog.getLines().contains("- Initial release."));
        }

        {
            String existingChangelog = "# Release History\n" + "\n" + "## 1.1.0-beta.1 (2020-11-20)\n" + "\n"
                + "- Unreleased changes.\n" + "\n" + "## 1.0.0 (2020-10-29)\n" + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(mockProject);

            Assertions.assertTrue(changelog.getLines().contains(String.format("## 1.1.0-beta.1 (%s)", dateUtc)));
            Assertions.assertTrue(changelog.getLines().contains("## 1.0.0 (2020-10-29)"));

            Assertions.assertFalse(changelog.getLines().contains("## 1.1.0-beta.1 (2020-11-20)"));

            Assertions.assertTrue(changelog.getLines().contains("- Unreleased changes."));
            Assertions.assertTrue(changelog.getLines().contains("- Initial release."));
        }
    }

    @Test
    public void testChangelogForApiVersion() {
        String apiVersionDescription = FluentProject.apiVersionDescription(java.util.Map.of("Client", "2023-01-01"));
        Assertions.assertEquals("Package api-version 2023-01-01.", apiVersionDescription);
        String apiVersionLine = "- " + apiVersionDescription;

        // insert into the top-most section, before existing bullets, other sections preserved
        {
            String existingChangelog = "# Release History\n" + "\n" + "## 1.1.0-beta.1 (Unreleased)\n" + "\n"
                + "- Added test cases.\n" + "\n" + "## 1.0.0 (2020-10-29)\n" + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(apiVersionDescription);

            int headerIndex = changelog.getLines().indexOf("## 1.1.0-beta.1 (Unreleased)");
            int apiVersionIndex = changelog.getLines().indexOf(apiVersionLine);
            int addedTestCasesIndex = changelog.getLines().indexOf("- Added test cases.");

            Assertions.assertEquals(headerIndex + 2, apiVersionIndex);
            Assertions.assertTrue(apiVersionIndex < addedTestCasesIndex);
            Assertions.assertTrue(changelog.getLines().contains("- Added test cases."));
            Assertions.assertTrue(changelog.getLines().contains("## 1.0.0 (2020-10-29)"));
            Assertions.assertTrue(changelog.getLines().contains("- Initial release."));
        }

        // re-run replaces the existing api-version line (no duplicate)
        {
            String existingChangelog = "# Release History\n" + "\n" + "## 1.1.0-beta.1 (Unreleased)\n" + "\n"
                + "- Package api-version 2022-06-06.\n" + "- Added test cases.\n" + "\n" + "## 1.0.0 (2020-10-29)\n"
                + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(apiVersionDescription);

            Assertions.assertTrue(changelog.getLines().contains(apiVersionLine));
            Assertions.assertFalse(changelog.getLines().contains("- Package api-version 2022-06-06."));
            Assertions.assertEquals(1,
                changelog.getLines().stream().filter(l -> l.startsWith("- Package api-version ")).count());
            Assertions.assertTrue(changelog.getLines().contains("- Added test cases."));
        }

        // no version section -> no change
        {
            String existingChangelog = "# Release History\n" + "\n" + "Some description.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(apiVersionDescription);

            Assertions.assertTrue(changelog.getLines().stream().noneMatch(l -> l.startsWith("- Package api-version ")));
        }

        // empty api-version description -> no change
        {
            String existingChangelog
                = "# Release History\n" + "\n" + "## 1.0.0 (2020-10-29)\n" + "\n" + "- Initial release.";

            Changelog changelog = new Changelog(existingChangelog);
            changelog.updateForVersion(FluentProject.apiVersionDescription(null));

            Assertions.assertTrue(changelog.getLines().stream().noneMatch(l -> l.startsWith("- Package api-version ")));
        }
    }

    @Test
    public void testChangelogForApiVersionRealSample() {
        // Based on a real CHANGELOG.md (azure-resourcemanager-compute), top 2 sections.
        String existingChangelog = "# Release History\n" + "\n" + "## 2.60.0-beta.1 (Unreleased)\n" + "\n"
            + "### Features Added\n" + "\n" + "### Breaking Changes\n" + "\n" + "### Bugs Fixed\n" + "\n"
            + "### Other Changes\n" + "\n" + "## 2.59.0 (2026-07-15)\n" + "\n" + "### Features Added\n" + "\n"
            + "* `models.ImmutabilityPolicyLockData` was added\n" + "\n"
            + "* `models.ImmutabilityPolicyData` was added\n" + "\n"
            + "#### `models.DiskSecurityProfile` was modified\n" + "\n" + "* `confidentialVMVersion()` was added\n"
            + "\n" + "### Other Changes\n" + "\n" + "- Updated `DiskRP api-version` to `2026-03-02`.";

        String apiVersionDescription = FluentProject.apiVersionDescription(java.util.Map.of("Compute", "2024-07-01"));
        String apiVersionLine = "- " + apiVersionDescription;

        Changelog changelog = new Changelog(existingChangelog);
        changelog.updateForVersion(apiVersionDescription);

        int headerIndex = changelog.getLines().indexOf("## 2.60.0-beta.1 (Unreleased)");
        int apiVersionIndex = changelog.getLines().indexOf(apiVersionLine);
        Assertions.assertEquals(headerIndex + 2, apiVersionIndex);
        Assertions.assertTrue(changelog.getLines().contains("### Features Added"));
        Assertions.assertTrue(changelog.getLines().contains("## 2.59.0 (2026-07-15)"));
        Assertions.assertTrue(changelog.getLines().contains("- Updated `DiskRP api-version` to `2026-03-02`."));
    }
}
