const { execSync, spawnSync } = require("child_process")
const download = require("image-downloader")
const fs = require("fs")
const mtg = require("mtgsdk")
const path = require("path")
const tempy = require("tempy")

var dir = tempy.directory()
var deckDir = tempy.directory()
var fetch = (name, count) => {
    return new Promise((resolve, reject) => {
        mtg.card
            .where({ name: name })
            .then(cards => {
                var originalFile = `${dir}/${name}.jpg`
                var grayFile = `${dir}/${name} (gray).jpg`
                var card = cards.find(c => c.imageUrl)
                download.image({ url: card.imageUrl, dest: originalFile})
                    .then(({filename, image}) => {
                        spawnSync("convert", [
                            originalFile,
                            "-type", "Grayscale",
                            "-shave", "8x8",
                            "-fuzz", "5%", "-trim",
                            "-units", "PixelsPerInch", "-density", "300", "-resize", "750x1050",
                            grayFile
                        ])
                        for(var i = 0; i < count; i++) {
                            fs.copyFileSync(grayFile, `${deckDir}/${name} ${i}.jpg`)
                        }
                        resolve()
                    })
            })
    })
}

var decklistPath = process.argv[2]
var deckName = path.basename(decklistPath, path.extname(decklistPath))
var cardList = fs.readFileSync(decklistPath).toString().split(/\r?\n/);
var fetches = []
const cardRegex = /^(\d+) (.*)$/
for(i in cardList) {
    var match = cardRegex.exec(cardList[i])
    if (match) {
        fetches.push(fetch(match[2], match[1]))
    }
}
Promise.all(fetches).then(() => {
    execSync(`montage ${deckDir}/\* -geometry 750x1050+102+0 -tile 3x3 ./${deckName}_proxies.pdf`)
}).catch(error => console.log("Caught: ", error.message))
