import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { Box } from '@/entities/box.entity'
import { getDataSource } from '@/app/lib/typeorm'
import { chunk, get } from 'lodash'

async function fetchBoxData() {
    let text : string = ''
    const filePath = path.join(process.cwd(), 'data', 'packs.html')
    const stat = await fs.promises.stat(filePath).then((stat) => stat).catch(() => null)
    const cacheHit = stat ? Date.now() - stat?.mtimeMs <  1000 * 60 * 60 * 24 : false
    if (!stat || !cacheHit) {
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
        text = await response.text()
        await fs.promises.writeFile(path.join(process.cwd(), "data", "packs.html"), text);
    } else {
        text = await fs.promises.readFile(filePath, 'utf8') 
    }
    const $ = cheerio.load(text)
    const ocg = $('#ocg .packs .pack').toArray().map(pack => {
        const $pack = $(pack)
        return {
            publishAt: new Date($pack.find('span').eq(0).text()),
            code: $pack.find('span').eq(1).text(),
            count: $pack.find('span').eq(2).text(),
            name: $pack.find('a').eq(0).text(),
            url: $pack.find('a').eq(0).attr('href'),
            language: 'JP',
        }
    })
    const tcg = $('#tcg .packs .pack').toArray().map(pack => {
        const $pack = $(pack)
        return {
            publishedAt: $pack.find('span').eq(0).text(),
            code: $pack.find('span').eq(1).text(),
            count: $pack.find('span').eq(2).text(),
            name: $pack.find('a').eq(0).text(),
            url: $pack.find('a').eq(0).attr('href'),
            language: 'EN',
        }
    })
    return [...ocg, ...tcg]
}


async function upsertBoxes(boxes: any) {
    const dataSource = await getDataSource()
    await dataSource.createQueryBuilder()
        .insert()
        .into(Box)
        .values(boxes)
        .orIgnore(`("id") DO NOTHING`)
        .execute()
}

export async function POST() {

    const packs = await fetchBoxData()

    const chunks = chunk(packs ?? [], 100)

    for (const chunk of chunks) {
        await upsertBoxes(chunk)
    }

    return NextResponse.json({ success: true });
}
