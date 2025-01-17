import { NextResponse } from 'next/server'
import { Card } from '@/entities/card.entity'
import { getDataSource } from '@/app/lib/typeorm'

type LuaScriptFileItem = {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
}

export async function POST(request: Request) {
    try {
        const dataSource = await getDataSource();
        const cardRepository = dataSource.getRepository(Card);

        const luaFileNames = [{ no: 'c1164211', status: 0 }];

        if (luaFileNames.length > 0) {
            await cardRepository
                .createQueryBuilder()
                .insert()
                .into(Card)
                .values(luaFileNames)
                .orIgnore()
                .execute();
        }

        return NextResponse.json({
            message: '同步成功',
            count: luaFileNames.length
        });
    } catch (error) {
        console.error('同步卡片数据失败:', error);
        return NextResponse.json(
            { error: '同步卡片数据失败' },
            { status: 500 }
        );
    }
}
