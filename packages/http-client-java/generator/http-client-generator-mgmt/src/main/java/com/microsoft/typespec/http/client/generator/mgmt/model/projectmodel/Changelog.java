// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.io.BufferedReader;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.SignStyle;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class Changelog {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), Changelog.class);

    private static final Pattern UNRELEASED_VERSION_PATTERN
        = Pattern.compile("^## ([0-9][-.a-z|0-9]+) \\(Unreleased\\)");

    private static final Pattern API_VERSION_LINE_PATTERN = Pattern.compile("^- Package api-version .*");

    private final List<String> lines;

    public Changelog(FluentProject project) {
        this(FluentUtils.loadTextFromResource("Changelog.txt", TemplateUtil.SERVICE_NAME, project.getServiceName(),
            TemplateUtil.SERVICE_DESCRIPTION, project.getServiceDescriptionForMarkdown(), TemplateUtil.ARTIFACT_VERSION,
            project.getVersion(), TemplateUtil.DATE_UTC, getDateUtc()));
    }

    public Changelog(String content) {
        this.lines = content.lines().collect(Collectors.toList());
    }

    public Changelog(BufferedReader reader) {
        this.lines = reader.lines().collect(Collectors.toList());
    }

    public void updateForVersion(FluentProject project) {
        List<String> sectionBefore = new ArrayList<>();
        List<String> sectionAfter = new ArrayList<>();
        String previousUnreleasedVersion = null;
        List<String> previousChangelog = new ArrayList<>();

        Pattern currentVersionPattern = Pattern.compile("^## " + Pattern.quote(project.getVersion()) + " \\(.*\\)");

        boolean beforeUnreleasedSection = true;
        boolean afterUnreleasedSection = false;
        for (String line : this.lines) {
            if (isVersionSectionHeader(line)) {
                if (beforeUnreleasedSection) {
                    beforeUnreleasedSection = false;

                    if (line.trim().endsWith("(Unreleased)")) {
                        Matcher m = UNRELEASED_VERSION_PATTERN.matcher(line.trim());
                        if (m.find()) {
                            previousUnreleasedVersion = m.group(1);
                            LOGGER.info("Found last unreleased version '{}'", previousUnreleasedVersion);
                        }
                    } else if (currentVersionPattern.matcher(line.trim()).find()) {
                        previousUnreleasedVersion = project.getVersion();
                        LOGGER.info("Found last version '{}', which is same as current version",
                            previousUnreleasedVersion);
                    } else {
                        afterUnreleasedSection = true;
                    }
                } else {
                    afterUnreleasedSection = true;
                }
            } else if (!beforeUnreleasedSection && !afterUnreleasedSection) {
                if (!previousChangelog.isEmpty() || !line.isEmpty()) {
                    previousChangelog.add(line);
                }
            }

            if (beforeUnreleasedSection) {
                sectionBefore.add(line);
            }
            if (afterUnreleasedSection) {
                sectionAfter.add(line);
            }
        }

        String currentChangelog = String.format("- Azure Resource Manager %1$s client library for Java. %2$s",
            project.getServiceName(), project.getServiceDescriptionForMarkdown());

        this.lines.clear();

        this.lines.addAll(sectionBefore);
        this.lines.add(String.format("## %1$s (%2$s)", project.getVersion(), getDateUtc()));
        this.lines.add("");
        this.lines.add(currentChangelog);
        if (!previousChangelog.isEmpty() && !previousChangelog.iterator().next().startsWith("- ")) {
            // blank line when first line is not unordered list
            this.lines.add("");
        }
        for (String line : previousChangelog) {
            if (!line.trim().equals(currentChangelog)) {
                this.lines.add(line);
            }
        }
        if (previousChangelog.isEmpty() || !previousChangelog.get(previousChangelog.size() - 1).trim().isEmpty()) {
            // blank line when last line is not blank line (or no line at all)
            this.lines.add("");
        }
        this.lines.addAll(sectionAfter);
    }

    /**
     * Inserts (or replaces) the api-version line into the top-most (latest) version section.
     * <p>
     * This is used for Fluent Premium, where the existing CHANGELOG.md is only annotated with the api-version,
     * instead of prepending a new version section as {@link #updateForVersion(FluentProject)} does.
     *
     * @param apiVersionDescription the api-version description, e.g. "Package api-version 2023-01-01.".
     */
    public void updateForVersion(String apiVersionDescription) {
        if (apiVersionDescription == null || apiVersionDescription.isEmpty()) {
            return;
        }

        String apiVersionLine = "- " + apiVersionDescription;

        // find the top-most "## " version section
        int headerIndex = -1;
        for (int i = 0; i < this.lines.size(); i++) {
            if (isVersionSectionHeader(this.lines.get(i))) {
                headerIndex = i;
                break;
            }
        }
        if (headerIndex < 0) {
            // no version section, nothing to update
            return;
        }

        // within the top section, replace the existing api-version line if present (idempotent regeneration)
        for (int i = headerIndex + 1; i < this.lines.size(); i++) {
            String line = this.lines.get(i).trim();
            if (isVersionSectionHeader(line)) {
                // reached the next section
                break;
            }
            if (API_VERSION_LINE_PATTERN.matcher(line).matches()) {
                this.lines.set(i, apiVersionLine);
                return;
            }
        }

        // insert a new api-version line right after the header, keeping a blank line after the header
        int insertIndex = headerIndex + 1;
        if (insertIndex < this.lines.size() && this.lines.get(insertIndex).trim().isEmpty()) {
            insertIndex++;
        } else {
            this.lines.add(insertIndex, "");
            insertIndex++;
        }
        this.lines.add(insertIndex, apiVersionLine);

        // keep a blank line between the inserted bullet and a following heading (e.g. "### Features Added")
        int nextIndex = insertIndex + 1;
        if (nextIndex < this.lines.size() && this.lines.get(nextIndex).trim().startsWith("#")) {
            this.lines.add(nextIndex, "");
        }
    }

    public String getContent() {
        return String.join("\n", lines) + "\n";
    }

    private static boolean isVersionSectionHeader(String line) {
        return line.trim().startsWith("## ");
    }

    List<String> getLines() {
        return lines;
    }

    private static final DateTimeFormatter FORMATTER
        = new DateTimeFormatterBuilder().appendValue(ChronoField.YEAR, 4, 10, SignStyle.EXCEEDS_PAD)
            .appendLiteral('-')
            .appendValue(ChronoField.MONTH_OF_YEAR, 2)
            .appendLiteral('-')
            .appendValue(ChronoField.DAY_OF_MONTH, 2)
            .toFormatter(Locale.ROOT);

    static String getDateUtc() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return now.format(FORMATTER);
    }
}
