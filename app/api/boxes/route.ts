import { NextResponse } from 'next/server'
import { Box } from '@/entities/box.entity'
import { getDataSource } from '@/app/lib/typeorm'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const language = searchParams.get('language');
        
        const dataSource = await getDataSource();
        const boxRepository = dataSource.getRepository(Box);
        
        const queryBuilder = boxRepository.createQueryBuilder('box');
        
        if (language) {
            queryBuilder.where('box.language = :language', { language });
        }
        
        const [boxes, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('box.publishAt', 'DESC')
            .getManyAndCount();

        return NextResponse.json({
            data: boxes,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('获取卡盒列表失败:', error);
        return NextResponse.json(
            { error: '获取卡盒列表失败' },
            { status: 500 }
        );
    }
}