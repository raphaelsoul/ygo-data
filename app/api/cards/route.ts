import { NextResponse } from 'next/server'
import { Card } from '@/entities/card.entity'
import { getDataSource } from '@/app/lib/typeorm'

export async function GET() {
    try {
        const dataSource = await getDataSource();
        const cardRepository = dataSource.getRepository(Card);
        const cards = await cardRepository.find();
        return NextResponse.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cards' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const dataSource = await getDataSource();
        const cardRepository = dataSource.getRepository(Card)
        const card = cardRepository.create(body)
        await cardRepository.save(card)
        return NextResponse.json(card, { status: 201 })
    } catch (error: unknown) {
        console.error('创建卡片出错:', error);
        return NextResponse.json(
            { error: '创建卡片失败' },
            { status: 500 }
        )
    }
}