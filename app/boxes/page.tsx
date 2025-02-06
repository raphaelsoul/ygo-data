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
import { Button } from '@heroui/button';
import {CheckboxGroup, Checkbox} from "@heroui/checkbox";

function AllBoxesSyncButton(props: { reload: (page: number) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/boxes/sync', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('同步失败');
      }
      await props.reload(1); // 同步后刷新第一页数据
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return <Button size='sm' color="secondary" isLoading={isLoading} onPress={handleSync}>
    {isLoading ? '同步中...' : '同步数据'}
  </Button>
}

function ReloadButton(props: { isLoading: boolean; reload: () => void }) {
  return <Button size='sm' color="primary" isLoading={props.isLoading} onPress={() => props.reload()}>
    {props.isLoading ? '加载中...' : '刷新列表'}
  </Button>
}

function SingleBoxSyncButton(props: { box: Box }) {
  const [isLoading, setIsLoading] = useState(false);
  return <Button size='sm' color="primary" variant='light' isLoading={isLoading}>同步</Button>
}


interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const LANGUAGES = [
  { label: '全部', value: '' },
  { label: '简体中文', value: 'ZH' },
  { label: '日本語', value: 'JP' },
  { label: 'English', value: 'EN' },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
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
          labelPlacement="outside-left"
        >
          {LANGUAGES.map(lang => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </Select>
        <AllBoxesSyncButton reload={fetchBoxes} />
        <ReloadButton isLoading={loading} reload={() => fetchBoxes(pagination.page)} />
      </div>

      <Table aria-label="卡盒列表">
        <TableHeader>
          <TableColumn colSpan={1} className="!w-12">
            <Checkbox aria-label="全选" />
          </TableColumn>
          <TableColumn>编号</TableColumn>
          <TableColumn>语言</TableColumn>
          <TableColumn>名称</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>发布时间</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody>
          {boxes.map((box) => (
            <TableRow key={box.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>{box.code}</TableCell>
              <TableCell>{box.language}</TableCell>
              <TableCell>{box.name}</TableCell>
              <TableCell>{box.status}</TableCell>
              <TableCell>{box.publishAt ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.publishAt)) : '-'}</TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.createdAt))}</TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.updatedAt))}</TableCell>
              <TableCell>
                <Button size='sm' color="primary" variant='light'>同步</Button>
              </TableCell>
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
          <Button
            size='sm'
            color="primary"
            onPress={handleJumpPage}
          >
            跳转
          </Button>
        </div>
      </div>
    </div>
  );
}
