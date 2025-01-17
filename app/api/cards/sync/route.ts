import { NextResponse } from 'next/server'
import { Card } from '@/entities/card.entity'
import { getDataSource } from '@/app/lib/typeorm'
import { globby } from 'globby'
import path from 'path'

export async function POST(request: Request) {
    const repoPath = process.env.YGO_SCRIPTS_REPO;
    if (!repoPath) {
        return NextResponse.json({ error: 'YGO_SCRIPTS_REPO环境变量未定义' }, { status: 500 });
    }
    const files = await globby('**/*.lua', { cwd: repoPath });
    const dataSource = await getDataSource();
    const cardRepository = dataSource.getRepository(Card);

    const chunks = Array.from({ length: Math.ceil(files.length / 100) }, (_, i) => files.slice(i * 100, (i + 1) * 100));
    for (const chunk of chunks) {
        await cardRepository.createQueryBuilder()
            .insert()
            .orIgnore()
            .values(chunk.map(file => ({ no: path.basename(file, '.lua') })))
            .execute();
    }
    return NextResponse.json({ success: true });
}
