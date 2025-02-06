'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';
import { Pagination } from '@heroui/react';
import { Spinner } from '@heroui/spinner';
import { Card } from '@/entities/card.entity';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { SharedSelection } from '@heroui/react';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function ReloadButton(props: { isLoading: boolean; reload: () => void }) {
  return (
    <Button
      size="sm"
      color="primary"
      isLoading={props.isLoading}
      onPress={() => props.reload()}
    >
      {props.isLoading ? '加载中...' : '刷新列表'}
    </Button>
  );
}

function SelectedCardSyncButton(props: { 
  selectedCardIds: { code: string | null; cid: string | null; }[];
  reload: () => void; 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const canPress = useMemo(() => props.selectedCardIds.length > 0, [props.selectedCardIds]);

  async function handleSync() {
    // 暂时保持为空函数
    console.log(props.selectedCardIds);
  }

  return (
    <Button
      size='sm' 
      color="primary" 
      isLoading={isLoading} 
      onPress={handleSync}
      isDisabled={!canPress}
    >
      同步内容
    </Button>
  )
}

function TableFooter(props: { handlePageChange: (page: number) => void; pagination: PaginationState; }) {
  const [jumpPage, setJumpPage] = useState<string>('');

  const handleJumpPage = () => {
    const page = parseInt(jumpPage);
    if (isNaN(page) || page < 1 || page > props.pagination.totalPages) {
      alert('请输入有效的页码');
      return;
    }
    props.handlePageChange(page);
    setJumpPage('');
  };

  return (
    <div className="mt-4 flex justify-between items-center">
      <Pagination
        total={props.pagination.totalPages}
        page={props.pagination.page}
        onChange={props.handlePageChange}
        showControls
        showShadow
        isCompact
      />
      <div className="flex items-center gap-2">
        <Input
          size="sm"
          placeholder="页码"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
          className="w-20"
        />
        <Button
          size='sm'
          color="primary"
          onPress={handleJumpPage}
        >
          跳转
        </Button>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string> | 'all'>(new Set([]));
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const selectedCardIds = useMemo(() => {
    if (selectedKeys === 'all') {
      return cards;
    }
    return cards.filter(card => selectedKeys.has(card.id));
  }, [selectedKeys, cards]);

  const fetchCards = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cards?page=${page}&pageSize=${pagination.pageSize}`);
      const data = await response.json();
      setCards(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('获取卡片列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards(pagination.page);
  }, [pagination.page]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">卡片列表</h1>
      <div className="flex justify-between items-center gap-2">
        <SelectedCardSyncButton 
          selectedCardIds={selectedCardIds}
          reload={() => fetchCards(pagination.page)}
        />
        <div className="flex justify-end items-center gap-2">
          <ReloadButton 
            isLoading={loading} 
            reload={() => fetchCards(pagination.page)} 
          />
        </div>
      </div>

      <Table 
        aria-label="卡片列表"
        selectionMode="multiple"
        color="primary"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
        bottomContent={
          <TableFooter 
            pagination={pagination}
            handlePageChange={handlePageChange}
          />
        }
      >
        <TableHeader>
          <TableColumn>卡密</TableColumn>
          <TableColumn>CID</TableColumn>
          <TableColumn>名称</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id}>
              <TableCell>{card.code}</TableCell>
              <TableCell>{card.cid}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{card.name?.zh ?? '-'}</div>
                  <div className="text-gray-500 text-sm">{card.name?.jp ?? '-'}</div>
                  <div className="text-gray-500 text-sm">{card.name?.en ?? '-'}</div>
                </div>
              </TableCell>
              <TableCell>
                {
                  card.status === 0 
                    ? <Chip color="danger" size="sm" variant="solid">未同步</Chip>
                    : <Chip color="success" size="sm" variant="solid">已同步</Chip>
                }
              </TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(card.createdAt))}</TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(card.updatedAt))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
