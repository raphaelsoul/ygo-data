import { NextResponse } from "next/server";
import path from 'path'
import fs from 'fs'
import * as cheerio from 'cheerio'
import { getDataSource } from "@/app/lib/typeorm";
import { Card } from "@/entities/card.entity";
import { EOL } from "os";

// https://ygocdb.com/card/58931850
async function fetchCardContent(cardId: string) {
  let text : string = ''
  const filePath = path.join(process.cwd(), 'data', `card${cardId}.html`)
  const stat = await fs.promises.stat(filePath).then((stat) => stat).catch(() => null)
  const cacheHit = stat ? Date.now() - stat?.mtimeMs <  1000 * 60 * 60 * 24 : false
  if (!stat || !cacheHit) {
    const response = await fetch(`https://ygocdb.com/card/${cardId}`, {
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
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    })
    text = await response.text()
    await fs.promises.writeFile(filePath, text);  
  } else {
    text = await fs.promises.readFile(filePath, 'utf-8');
  }

  const $ = cheerio.load(text);

  const cardInfo = {
    desc: $('.desc')
      .html()!
      .replace(/<br\s*\/?>/g, EOL)
      .replace(/<\/?[^>]+>/g, ''),
    img: $('.cardimg img').eq(0).attr('src'),
  };


  return cardInfo;
}

export async function POST(request: Request) {
  const { cardIds } = await request.json();

  const dataSource = await getDataSource()

  for (const cardId of cardIds) {
    const content = await fetchCardContent(cardId)
    console.log(content)
    const row = await dataSource.getRepository(Card).findOne({ where: { code: cardId } })
    if (!row) {
      console.warn(`code: ${cardId} not found in database`)
      continue
    }

    fs.writeFileSync(
      path.join(process.cwd(), 'data', `text${cardId}.txt`),
      [
        row.name?.zh,
        row.name?.jp,
        row.name?.en,
      ].join(EOL) 
      + EOL
      + row.code + EOL
      + row.cid + EOL
      + content.desc,
      'utf8'
    )

    if (content.img) {
      const response = await fetch(content.img);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const filePath = path.join(process.cwd(), 'data', `img${cardId}.${content.img.split('.').pop()}`);
      await fs.promises.writeFile(filePath, uint8Array);
    }

    await dataSource.getRepository(Card).update({ code: cardId }, { status: true });
  }
  return NextResponse.json({ success: true });
}
