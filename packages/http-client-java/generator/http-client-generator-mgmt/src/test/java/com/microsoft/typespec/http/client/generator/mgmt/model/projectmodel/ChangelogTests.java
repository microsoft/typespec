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
            super("Resource", null);
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
}
