import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'

export async function POST() {
    const response = await fetch("https://ygocdb.com/packs", {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "sec-ch-ua": "\"Microsoft Edge\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1"
        },
        "referrer": "https://ygocdb.com/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });
    const text = await response.text()
    await fs.promises.writeFile(path.join(process.cwd(), "data", "packs.html"), text);

    const $ = cheerio.load(text)
    const packs = $('#ocg .packs .pack').toArray().map(pack => {
        const $pack = $(pack)
        return {
            publishedAt: $pack.find('span').eq(0).text(),
            code: $pack.find('span').eq(1).text(),
            count: $pack.find('span').eq(2).text(),
            name: $pack.find('a').eq(0).text(),
            language: 'JP',
        }
    })

    return NextResponse.json({ success: true });
}
