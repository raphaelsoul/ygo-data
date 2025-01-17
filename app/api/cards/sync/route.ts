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

        // TODO: 这里添加同步逻辑
        // 1. 调用游戏王API获取最新卡片数据
        // 2. 更新本地数据库
        // const response = await fetch('https://api.github.com/repos/Fluorohydride/ygopro-scripts/contents?ref=master');
        // if (!response.ok) {
        //     throw new Error(`获取卡片数据失败: ${response.statusText}`);
        // }
        
        // const luaFiles = (await response.json()) as LuaScriptFileItem[];
        // const luaFileNames = luaFiles
        //     .filter((file: LuaScriptFileItem) => file.name.endsWith('.lua'))
        //     .map((file: LuaScriptFileItem) => ({
        //         no: file.name.replace(/\.lua$/, ''),
        //         status: 0
        //     }));

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
