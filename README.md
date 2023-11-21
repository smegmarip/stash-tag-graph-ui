# Stash Tag Graph UI

Inspired by the [tagGraph](https://github.com/stashapp/CommunityScripts/tree/main/plugins/tagGraph), [stashUserScriptLibrary](https://github.com/stashapp/CommunityScripts/tree/main/plugins/1.%20stashUserscriptLibrary), and [Stats](https://github.com/stashapp/CommunityScripts/tree/main/plugins/2.%20stats) community plugins.

---

## Requirements

- [stashUserScriptLibrary](https://github.com/stashapp/CommunityScripts/tree/main/plugins/1.%20stashUserscriptLibrary) - bundled

---

## Usage

### Running as a plugin

- Move the `1. stashUserscriptLibrary` and `5. tagGraphUI` directories into Stash's plugins directory, reload plugins and you can see and interact with the graph on the Stats page.
- Double clicking a node will open the associated tag page in a separate window.

---

## Customizing the graph

Plugin options are currently part of the `generateGraph` function.

For more info see [Vis Network Docs](https://visjs.github.io/vis-network/docs/network/)

---

## Changelog

- v.0.0.1 Basic no-whistles implementation.
