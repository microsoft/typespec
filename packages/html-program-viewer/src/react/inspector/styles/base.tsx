import { unselectable } from "./unselectable.js";

export const createTheme = (theme: any) => ({
  DOMNodePreview: {
    htmlOpenTag: {
      base: {
        color: theme.HTML_TAG_COLOR,
      },
      tagName: {
        color: theme.HTML_TAGNAME_COLOR,
        textTransform: theme.HTML_TAGNAME_TEXT_TRANSFORM,
      },
      htmlAttributeName: {
        color: theme.HTML_ATTRIBUTE_NAME_COLOR,
      },
      htmlAttributeValue: {
        color: theme.HTML_ATTRIBUTE_VALUE_COLOR,
      },
    },
    htmlCloseTag: {
      base: {
        color: theme.HTML_TAG_COLOR,
      },
      offsetLeft: {
        /* hack: offset placeholder */
        marginLeft: -theme.TREENODE_PADDING_LEFT,
      },
      tagName: {
        color: theme.HTML_TAGNAME_COLOR,
        textTransform: theme.HTML_TAGNAME_TEXT_TRANSFORM,
      },
    },
    htmlComment: {
      color: theme.HTML_COMMENT_COLOR,
    },
    htmlDoctype: {
      color: theme.HTML_DOCTYPE_COLOR,
    },
  },

  ObjectPreview: {
    objectDescription: {
      fontStyle: "italic",
    },
    preview: {
      fontStyle: "italic",
    },
    arrayMaxProperties: theme.OBJECT_PREVIEW_ARRAY_MAX_PROPERTIES,
    objectMaxProperties: theme.OBJECT_PREVIEW_OBJECT_MAX_PROPERTIES,
  },

  ObjectName: {
    base: {
      color: theme.OBJECT_NAME_COLOR,
    },
    dimmed: {
      opacity: 0.6,
    },
  },

  ObjectValue: {
    objectValueNull: {
      color: theme.OBJECT_VALUE_NULL_COLOR,
    },
    objectValueUndefined: {
      color: theme.OBJECT_VALUE_UNDEFINED_COLOR,
    },
    objectValueRegExp: {
      color: theme.OBJECT_VALUE_REGEXP_COLOR,
    },
    objectValueString: {
      color: theme.OBJECT_VALUE_STRING_COLOR,
    },
    objectValueSymbol: {
      color: theme.OBJECT_VALUE_SYMBOL_COLOR,
    },
    objectValueNumber: {
      color: theme.OBJECT_VALUE_NUMBER_COLOR,
    },
    objectValueBoolean: {
      color: theme.OBJECT_VALUE_BOOLEAN_COLOR,
    },
    objectValueFunctionPrefix: {
      color: theme.OBJECT_VALUE_FUNCTION_PREFIX_COLOR,
      fontStyle: "italic",
    },
    objectValueFunctionName: {
      fontStyle: "italic",
    },
  },

  TreeView: {
    treeViewOutline: {
      padding: 0,
      margin: 0,
      listStyleType: "none",
    },
  },

  TreeNode: {
    treeNodeBase: {
      color: theme.BASE_COLOR,
      backgroundColor: theme.BASE_BACKGROUND_COLOR,

      lineHeight: theme.TREENODE_LINE_HEIGHT,
      cursor: "default",

      boxSizing: "border-box",
      listStyle: "none",

      fontFamily: theme.TREENODE_FONT_FAMILY,
      fontSize: theme.TREENODE_FONT_SIZE,
    },
    treeNodePreviewContainer: {},
    treeNodePlaceholder: {
      whiteSpace: "pre",

      fontSize: theme.ARROW_FONT_SIZE,
      marginRight: theme.ARROW_MARGIN_RIGHT,
      ...unselectable,
    },
    treeNodeArrow: {
      base: {
        color: theme.ARROW_COLOR,
        display: "inline-block",
        // lineHeight: '14px',
        fontSize: theme.ARROW_FONT_SIZE,
        marginRight: theme.ARROW_MARGIN_RIGHT,
        ...(parseFloat(theme.ARROW_ANIMATION_DURATION) > 0
          ? {
              transition: `transform ${theme.ARROW_ANIMATION_DURATION} ease 0s`,
            }
          : {}),
        ...unselectable,
      },
      expanded: {
        WebkitTransform: "rotateZ(90deg)",
        MozTransform: "rotateZ(90deg)",
        transform: "rotateZ(90deg)",
      },
      collapsed: {
        WebkitTransform: "rotateZ(0deg)",
        MozTransform: "rotateZ(0deg)",
        transform: "rotateZ(0deg)",
      },
    },
    treeNodeChildNodesContainer: {
      margin: 0, // reset user-agent style
      paddingLeft: theme.TREENODE_PADDING_LEFT,
    },
  },

  TableInspector: {
    base: {
      color: theme.BASE_COLOR,

      position: "relative",
      border: `1px solid ${theme.TABLE_BORDER_COLOR}`,
      fontFamily: theme.BASE_FONT_FAMILY,
      fontSize: theme.BASE_FONT_SIZE,
      lineHeight: "120%",
      boxSizing: "border-box",
      cursor: "default",
    },
  },

  TableInspectorHeaderContainer: {
    base: {
      top: 0,
      height: "17px",
      left: 0,
      right: 0,
      overflowX: "hidden",
    },
    table: {
      tableLayout: "fixed",
      borderSpacing: 0,
      borderCollapse: "separate",
      height: "100%",
      width: "100%",
      margin: 0,
    },
  },

  TableInspectorDataContainer: {
    tr: {
      display: "table-row",
    },
    td: {
      boxSizing: "border-box",
      border: "none", // prevent overrides
      height: "16px", // /* 0.5 * table.background-size height */
      verticalAlign: "top",
      padding: "1px 4px",
      WebkitUserSelect: "text",

      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      lineHeight: "14px",
    },
    div: {
      position: "static",
      top: "17px",
      bottom: 0,
      overflowY: "overlay",
      transform: "translateZ(0)",

      left: 0,
      right: 0,
      overflowX: "hidden",
    },
    table: {
      positon: "static",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      borderTop: "0 none transparent",
      margin: 0, // prevent user agent stylesheet overrides

      backgroundImage: theme.TABLE_DATA_BACKGROUND_IMAGE,
      backgroundSize: theme.TABLE_DATA_BACKGROUND_SIZE,
      tableLayout: "fixed",

      // table
      borderSpacing: 0,
      borderCollapse: "separate",
      // height: '100%',
      width: "100%",

      fontSize: theme.BASE_FONT_SIZE,
      lineHeight: "120%",
    },
  },

  TableInspectorTH: {
    base: {
      position: "relative", // anchor for sort icon container
      height: "auto",
      textAlign: "left",
      backgroundColor: theme.TABLE_TH_BACKGROUND_COLOR,
      borderBottom: `1px solid ${theme.TABLE_BORDER_COLOR}`,
      fontWeight: "normal",
      verticalAlign: "middle",
      padding: "0 4px",

      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      lineHeight: "14px",

      ":hover": {
        backgroundColor: theme.TABLE_TH_HOVER_COLOR,
      },
    },
    div: {
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",

      // prevent user agent stylesheet overrides
      fontSize: theme.BASE_FONT_SIZE,
      lineHeight: "120%",
    },
  },

  TableInspectorLeftBorder: {
    none: {
      borderLeft: "none",
    },
    solid: {
      borderLeft: `1px solid ${theme.TABLE_BORDER_COLOR}`,
    },
  },

  TableInspectorSortIcon: {
    display: "block",
    marginRight: 3, // 4,
    width: 8,
    height: 7,

    marginTop: -7,
    color: theme.TABLE_SORT_ICON_COLOR,
    fontSize: 12,
    // lineHeight: 14
    ...unselectable,
  },
});
