(function () {
  function createGraphElement(container, title, heading) {
    const graphEl = document.createElement("div");
    graphEl.classList.add("graph-element");
    container.appendChild(graphEl);

    const graphTitle = document.createElement("p");
    graphTitle.classList.add("title");
    graphTitle.innerText = title;
    graphEl.appendChild(graphTitle);

    const graphHeading = document.createElement("p");
    graphHeading.classList.add("heading");
    graphHeading.innerText = heading;
    graphEl.appendChild(graphHeading);
  }

  async function callGraphQL(reqData) {
    try {
      let result = await stash.callGQL(reqData);
      if (result.errors) {
        result.errors.forEach((error) =>
          console.error(`GraphQL error: ${error}`)
        );
      }
      return result.data;
    } catch (e) {
      return false;
    }
  }

  async function getStashConfig() {
    const reqData = {
      query:
        "query Configuration {\n    configuration { general { stashes{ path } } }\n}",
    };
    return (await stash.callGQL(reqData)).data.configuration;
  }

  async function getTagsWithRelations() {
    const reqData = {
      variables: {
        tag_filter: {
          child_count: { modifier: "GREATER_THAN", value: 0 },
          OR: {
            parent_count: { modifier: "GREATER_THAN", value: 0 },
          },
        },
        filter: { q: "", per_page: -1 },
      },
      query: `
        query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {
            findTags(filter: $filter, tag_filter: $tag_filter) {
                count
                tags {
                    id
                    name
                    scene_count(depth: -1)
                    parents { id }
                    children { id }
                }
            }
        }`,
    };
    const result = await callGraphQL(reqData);
    return result.findTags.tags;
  }

  function nodeSize(count, maxCount, minCount) {
    const maxSize = 100,
      minSize = 25,
      scaleFactor = (maxSize - minSize) / (maxCount - minCount);

    return minSize + count * scaleFactor;
  }

  function nodeScale(min, max, total, value) {
    if (max === min) {
      return 0.5;
    } else {
      var scale = 1 / (max - min);
      return Math.max(0.2, (value - min) * scale);
    }
  }

  function multilineLabel(text, maxWidth) {
    if (text.length <= maxWidth) {
      return text;
    }
    const pieces = text.split(" "),
      lines = [""];
    let i = 0;

    for (piece of pieces) {
      if (lines[i].length == 0 || lines[i].length + piece.length <= maxWidth) {
        lines[i] += " " + piece;
      } else {
        i++;
        lines[i] = piece;
      }
    }

    return lines.join("\n");
  }

  function generateGraph(tags) {
    const maxCount = tags.reduce(
      (max, tag) => (tag.scene_count > max ? tag.scene_count : max),
      0
    );
    const minCount = tags.reduce(
      (min, tag) => (tag.scene_count < min ? tag.scene_count : min),
      tags[0].scene_count
    );
    const totalCount = tags.reduce((tot, tag) => tot + tag.scene_count, 0);
    const nodes = tags.map((tag) => ({
      id: tag.id,
      label: multilineLabel(
        tag.name + " (" + tag.scene_count + ")",
        Math.ceil(Math.max((tag.scene_count / maxCount) * 35, 6))
      ),
      value: tag.scene_count,
    }));
    const edges = tags.flatMap((tag) =>
      tag.children.map((child) => ({
        from: tag.id,
        to: child.id,
      }))
    );

    const container = document.getElementById("graph-network");
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges),
    };
    const options = {
      width: window.innerWidth - 25 + "px",
      height: window.innerHeight - 75 + "px",
      nodes: {
        shape: "circle",
        scaling: {
          min: 100,
          max: 250,
          customScalingFunction: nodeScale,
          label: {
            enabled: true,
            min: 4,
            max: 30,
            drawThreshold: 2,
          },
        },
      },
      edges: {
        arrows: {
          to: { enabled: true, scaleFactor: 1, type: "arrow" },
        },
      },
      layout: {
        improvedLayout: false,
      },
      autoResize: true,
    };
    const network = new vis.Network(container, data, options);

    network.on("doubleClick", function (params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const url = "/tags/" + nodeId;
        window.open(url, "vis_tag");
      }
    });
  }

  stash.addEventListener("page:stats", function () {
    try {
      if (getStashConfig()) {
        waitForElementByXpath(
          "//div[contains(@class, 'container-fluid')]/div[@class='mt-5']",
          async function (xpath, el) {
            if (!document.getElementById("custom-tags-row")) {
              const changelog = el.querySelector("div.changelog");
              const row = document.createElement("div");
              row.setAttribute("id", "custom-tags-row");
              row.classList.add(
                "col",
                "col-md-12",
                "col-sm-8",
                "m-sm-auto",
                "row",
                "stats"
              );
              el.insertBefore(row, el.firstChild);
              const container = document.createElement("div");
              container.setAttribute("id", "graph-network");
              container.setAttribute(
                "style",
                "border: 2px solid blue; overflow: hidden;"
              );
              container.classList.add("w-100");
              row.appendChild(container);

              const tags = await getTagsWithRelations();
              console.log("generating graph...");

              generateGraph(tags);
            }
          }
        );
      } else {
        console.log("Couldn't connect to Stash API.");
      }
    } catch (e) {
      console.dir(e);
    }
  });
})();
