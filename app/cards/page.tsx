'use client';

import { useEffect, useState } from 'react';
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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [jumpPage, setJumpPage] = useState<string>('');

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

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/cards/sync', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('同步失败');
      }
      await fetchCards(1); // 同步后刷新第一页数据
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchCards(pagination.page);
  }, [pagination.page]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleJumpPage = () => {
    const page = parseInt(jumpPage);
    if (isNaN(page) || page < 1 || page > pagination.totalPages) {
      alert('请输入有效的页码');
      return;
    }
    handlePageChange(page);
    setJumpPage('');
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
      <div className="flex justify-end items-center gap-2">
        <button
          className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '同步中...' : '同步数据'}
        </button>
        <button
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={() => fetchCards(pagination.page)}
          disabled={loading}
        >
          {loading ? '加载中...' : '刷新列表'}
        </button>
      </div>

      <Table aria-label="卡片列表">
        <TableHeader>
          <TableColumn>卡密</TableColumn>
          <TableColumn>CID</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.code}>
              <TableCell>{card.code}</TableCell>
              <TableCell>{card.cid}</TableCell>
              <TableCell>{card.status}</TableCell>
              <TableCell>{new Date(card.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(card.updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <button
                  className="px-2 py-1 bg-warning text-white rounded-md hover:bg-warning/90"
                  onClick={() => console.log('更新', card.code)}
                >
                  更新
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-center">
        <Pagination
          total={pagination.totalPages}
          page={pagination.page}
          onChange={handlePageChange}
        />
        <div className="flex items-center gap-2 mt-4">
          <Input
            size="sm"
            placeholder="页码"
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
            className="w-20"
          />
          <button
            className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={handleJumpPage}
          >
            跳转
          </button>
        </div>
      </div>
    </div>
  );
}
