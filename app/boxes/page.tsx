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
import { Pagination, SharedSelection } from '@heroui/react';
import { Spinner } from '@heroui/spinner';
import { Box } from '@/entities/box.entity';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const LANGUAGES = [
  { label: '全部', value: '' },
  { label: '简体中文', value: 'zh' },
  { label: '日本語', value: 'ja' },
  { label: 'English', value: 'en' },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [language, setLanguage] = useState(new Set<string>());
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [jumpPage, setJumpPage] = useState<string>('');

  const fetchBoxes = async (page: number = 1) => {
    try {
      setLoading(true);
      const url = new URL('/api/boxes', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('pageSize', pagination.pageSize.toString());
      if (language) {
        url.searchParams.set('language', Array.from(language).join(','));
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setBoxes(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('获取卡盒列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/boxes/sync', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('同步失败');
      }
      await fetchBoxes(1); // 同步后刷新第一页数据
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchBoxes(pagination.page);
  }, [pagination.page, language]);

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


  const handleLanguageChange = (keys: SharedSelection) => {
    setLanguage(keys as Set<string>);
    setPagination(prev => ({ ...prev, page: 1 }));
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
      <h1 className="text-2xl font-bold">卡盒列表</h1>
      <div className="flex justify-end items-center gap-2">
        <Select
          label="语言"
          selectedKeys={language}
          onSelectionChange={handleLanguageChange}
          className="w-32"
          size="sm"
        >
          {LANGUAGES.map(lang => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </Select>
        <button
          className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '同步中...' : '同步数据'}
        </button>
        <button
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={() => fetchBoxes(pagination.page)}
          disabled={loading}
        >
          {loading ? '加载中...' : '刷新列表'}
        </button>
      </div>

      <Table aria-label="卡盒列表">
        <TableHeader>
          <TableColumn>编号</TableColumn>
          <TableColumn>语言</TableColumn>
          <TableColumn>名称</TableColumn>
          <TableColumn>描述</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>发布时间</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
        </TableHeader>
        <TableBody>
          {boxes.map((box) => (
            <TableRow key={box.id}>
              <TableCell>{box.code}</TableCell>
              <TableCell>{box.language}</TableCell>
              <TableCell>{box.name}</TableCell>
              <TableCell>{box.description}</TableCell>
              <TableCell>{box.status}</TableCell>
              <TableCell>{box.publishAt ? new Date(box.publishAt).toLocaleString() : '-'}</TableCell>
              <TableCell>{new Date(box.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(box.updatedAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-between items-center">
        <Pagination
          total={pagination.totalPages}
          page={pagination.page}
          onChange={handlePageChange}
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
