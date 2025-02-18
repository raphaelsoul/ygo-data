import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import * as cheerio from 'cheerio'
import { getDataSource } from '@/app/lib/typeorm'
import { chunk, get } from 'lodash'
import { Card } from '@/entities/card.entity'
import { Box } from '@/entities/box.entity'

async function fetchBoxContent(boxId: string) {
    let text : string = ''
    const filePath = path.join(process.cwd(), 'data', `pack${boxId}.html`)
    const stat = await fs.promises.stat(filePath).then((stat) => stat).catch(() => null)
    const cacheHit = stat ? Date.now() - stat?.mtimeMs <  1000 * 60 * 60 * 24 : false
    if (!stat || !cacheHit) {
        const response = await fetch(`https://ygocdb.com/pack/${boxId}`, {
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
            "referrer": "https://ygocdb.com/packs",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        })
        text = await response.text()
        await fs.promises.writeFile(filePath, text);
    } else {
        text = await fs.promises.readFile(filePath, 'utf8')
    }
    const $ = cheerio.load(text)
    const cards = $('.row.card.result').toArray().map(card => {
        const $card = $(card)
        const href = $card.find('.cardimg a').attr('href')
        const $names = $card.find('.names')
        const cid = $names.find('.cid').text()
        const code = href?.match(/\/card\/(\d+)/)?.[1] || ''
        const zh = $names.find('span[lang="zh-Hans"]').eq(0).text()
        const en = $names.find('span[lang="zh-Hans"]').eq(1).text()
        const jp = $names.find('span[lang="ja-Jpan"]').text()
        return {
            code: code,
            cid: cid,
            name: {
                zh: zh ?? null,
                en: en ?? null,
                jp: jp ?? null,
            },
        }
    })
    return cards
}

async function upsertCards(boxId: string, cards: any[]) {
    const dataSource = await getDataSource()
    await dataSource.createQueryBuilder()
        .insert()
        .into(Card)
        .values(cards)
        .orIgnore(`("id") DO NOTHING`)
        .execute()
    await dataSource
        .createQueryBuilder()
        .update(Box)
        .set({ status: 1 })
        .where('boxId = :boxId', { boxId })
        .execute();
}

export async function POST(request: Request) {
    const body = await request.json()
    const boxIds = body.boxIds

    for (const boxId of boxIds) {
        const cards = await fetchBoxContent(boxId)
        const chunks = chunk(cards ?? [], 100)
        for (const chunk of chunks) {
            await upsertCards(boxId, chunk)
        }
    }
    
    return NextResponse.json({ success: true })
}
