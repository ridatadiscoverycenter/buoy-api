// scrape the fish database for metadata on our fish species
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const URI_SPECIES_URL = "https://web.uri.edu/fishtrawl/species/";
const FISHBASE_URL = "https://www.fishbase.us";

const getFishData = (name, href) => {
  axios
    .get(href)
    .then((r) => {
      const $fish = cheerio.load(r.data);
      const sciName = $fish("#ss-sciname")
        .text()
        .split("(", 1)[0]
        .trim();

      // try again if this one failed
      if (sciName === "") {
        console.log("retrying ", name)
        getFishData(name, href);
        return;
      }

      let photoUrl = FISHBASE_URL;
      if ($fish("#ss-photo img").attr("src")) {
        photoUrl += $fish("#ss-photo img").attr("src");
      } else {
        photoUrl += $fish("#ss-photo-full img").attr("src");
      }
      const sections = $fish("#ss-main > h1,form");
      const sectionData = {
        Classification: "",
        Environment: "",
        Distribution: "",
        "Short description": "",
        Biology: "",
        "Life cycle": "",
        IUCN: "",
      };
      $fish(sections).each((i, section) => {
        const header = $fish(section).text().trim();
        const text = $fish(section)
          .next("div.smallSpace")
          .text()
          .trim()
          .replaceAll(/\(Ref[s]?\. [0-9, ]+\)/g, "")
          .replaceAll(/\t+/g, "");
        Object.keys(sectionData).forEach((key) => {
          if (header.startsWith(key)) {
            sectionData[key] = text.replaceAll(/\n/g, " ");
          }
        });
        // further parse classification
        if (header.startsWith("Classification")) {
          const texts = text
            .split("\n")
            .map((t) => {
              const parts = t.split(":");
              const res = {};
              if (parts.length === 1) {
                res["Classification"] = t;
              } else if (parts.length === 2) {
                res[parts[0]] = parts[1];
              } else {
                res[parts[0]] = parts.slice(1).join(":");
              }
              return res;
            })
            .reduce(
              (accumulator, currentValue) => ({
                ...accumulator,
                ...currentValue,
              }),
              {}
            );
          sectionData["Classification"] = texts;
        }
      });

      // IUCN status is too weird - handling as a one off
      sectionData["IUCN"] = $fish(
        "div.sleft.sonehalf > div.smallSpace > span > span > a"
      )
        .text()
        .trim();

      const data = { href, name, sciName, photoUrl, sectionData };
      const dataStr = JSON.stringify(data).replaceAll(/\s+/g, " ");
      fs.writeFileSync(`data/fish/${name}.json`, dataStr);
      console.log(name);
    })
    .catch((e) => console.log(e));
}

axios
  .get(URI_SPECIES_URL)
  .then((res) => {
    const $ = cheerio.load(res.data);
    const tableRows = $("table.aligncenter tr");
    $(tableRows).each((i, row) => {
      if ($(row).find("td").length === 2) {
        const name = $(row).find("td").first().text().trim();
        if ($(row).find("a").length > 0) {
          const href = $(row).find("a").attr("href");
          getFishData(name, href)
        } else if (name && name !== "COMMON NAME") {
          const data = { name, sciName: $(row).find("td").last().text() };
          fs.writeFileSync(`data/fish/${name}.json`, JSON.stringify(data));
          console.log(name);
        }
      }
    });
  })
  .catch((e) => console.log(e));
