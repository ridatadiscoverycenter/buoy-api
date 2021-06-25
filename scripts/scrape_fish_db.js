// scrape the fish database for metadata on our fish species
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URI_SPECIES_URL = 'https://web.uri.edu/fishtrawl/species/';
const FISHBASE_URL = 'https://www.fishbase.us'

axios.get(URI_SPECIES_URL).then(res => {
  const $ = cheerio.load(res.data);
  const fishLinks = $('table.aligncenter a')
  $(fishLinks).each((i, link) => {
    const href = $(link).attr('href');
    const name = $(link).text();
    axios.get(href).then(r => {
      console.log(name)
      const $fish = cheerio.load(r.data);
      const sciName = $fish('#ss-sciname').text().split('(', 1)[0].trim();
      const photoUrl = FISHBASE_URL + $fish('#ss-photo img').attr('src');
      const sections = $fish('#ss-main > h1,form');
      const sectionData = {
        'Classification': '',
        'Environment': '',
        'Distribution': '',
        'Short description': '',
        'Biology': '',
        'Life cycle': '',
        'IUCN': ''
      }
      $fish(sections).each((i, section) => {
        const header = $fish(section).text().trim();
        const text = $fish(section).next('div.smallSpace').text().trim().replaceAll(/\n/g, " ").replaceAll(/\t+/g, "");
        Object.keys(sectionData).forEach(key => {
          if (header.startsWith(key)) {
            sectionData[key] = text;
            console.log(text);
          }
        });
      })

      // IUCN status is too weird - handling as a one off
      sectionData['IUCN'] = $fish('div.sleft.sonehalf > div.smallSpace > span > span > a').text().trim();

      const data = {href, name, sciName, photoUrl, sectionData};
      const dataStr = JSON.stringify(data).replaceAll(/\s+/g, " ")
      // console.log(dataStr);
      fs.writeFileSync(`data/fish/${name}.json`, dataStr);
    })
  })
})
