import { NextResponse } from 'next/server'
import { Card } from '@/entities/card.entity'
import { getDataSource } from '@/app/lib/typeorm'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        
        const dataSource = await getDataSource();
        const cardRepository = dataSource.getRepository(Card);
        
        const [cards, total] = await cardRepository.findAndCount({
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: {
                code: 'DESC'
            }
        });

        return NextResponse.json({
            data: cards,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('获取卡片列表失败:', error);
        return NextResponse.json(
            { error: '获取卡片列表失败' },
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