import { NextResponse } from 'next/server'
import { Card } from '@/entities/card.entity'
import { getDataSource } from '@/app/lib/typeorm'
import { globby } from 'globby'
import path from 'path'
import fs from 'fs'
import { chunk, get } from 'lodash'
import JSZip from 'jszip'

async function fetchCardData() {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')
    if (!response.ok) {
        throw new Error(`Failed to fetch card data: ${response.statusText}`)
    }
    const data = await response.json()
    if (!data) {
        throw new Error('No data received from the API')
    }
    const filePath = path.join(process.cwd(), 'data', 'cardinfo.json')
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
    return data
}

async function upsertCards(cards: any[]) {
    // const dataSource = await getDataSource()
    // await dataSource.createQueryBuilder()
    //     .insert()
    //     .into(Card)
    //     .values(cards)
    //     .orIgnore(`("id") DO NOTHING`)
    //     .execute()
}

export async function POST(request: Request) {
    let data : any = {}
    const filePath = path.join(process.cwd(), 'data', 'cardinfo.json')
    const stat = await fs.promises.stat(filePath).then((stat) => stat).catch(() => null)
    
    const cacheHit = stat ? Date.now() - stat?.mtimeMs <  1000 * 60 * 60 * 24 : false
    if (!stat || !cacheHit) {
        try {
            data = await fetchCardData()
        } catch (error) {
            console.error('读取卡片数据失败:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch card data' });
        }
    } else {
        try {
            data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'))
        } catch (error) {
            console.error('读取缓存卡片数据失败:', error);
            try {
                data = await fetchCardData()
            } catch (error) {
                console.error('读取卡片数据失败:', error);
                return NextResponse.json({ success: false, error: 'Failed to fetch card data' });
            }
        }
    }

    const chunks = chunk(data.data ?? [], 10)
    
    for (const chunk of chunks) {
        const rows = chunk.map((card: any) => ({ code: card.id, cid: get(card, 'misc_info.0.konami_id') }))
        await upsertCards(rows)
    }

    return NextResponse.json({ success: true });
}
