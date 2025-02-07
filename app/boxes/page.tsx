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
import { Pagination, SharedSelection } from '@heroui/react';
import { Spinner } from '@heroui/spinner';
import { Box } from '@/entities/box.entity';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
    {isLoading ? '同步中...' : '同步卡盒'}
  </Button>
}

function ReloadButton(props: { isLoading: boolean; reload: () => void }) {
  return <Button size='sm' color="primary" isLoading={props.isLoading} onPress={() => props.reload()} isIconOnly>
    <ArrowPathIcon className="w-5 h-5" />
  </Button>
}

function SelectedBoxSyncButton(props: { selectedBoxIds: string[]; reload: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);

  const canPress = useMemo(() => props.selectedBoxIds.length > 0, [props.selectedBoxIds]);

  async function handleSync() {
    console.log(props.selectedBoxIds);
    try {
      setIsLoading(true);
      const response = await fetch('/api/boxes/fetch', {
        method: 'POST',
        body: JSON.stringify({ boxIds: props.selectedBoxIds }),
      });
      if (!response.ok) {
        throw new Error('同步失败');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error('同步失败');
      }
      props.reload();
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setIsLoading(false);
    }
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

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '已同步', value: '1' },
  { label: '未同步', value: '0' },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(new Set<string>());
  const [status, setStatus] = useState(new Set<string>());
  const [selectedKeys, setSelectedKeys] = useState<Set<string> | 'all'>(new Set([]));
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchBoxes = async (page: number = 1) => {
    try {
      setLoading(true);
      const url = new URL('/api/boxes', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('pageSize', pagination.pageSize.toString());
      if (language.size > 0) {
        url.searchParams.set('language', Array.from(language).join(','));
      }
      if (status.size > 0) {
        url.searchParams.set('status', Array.from(status).join(','));
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
  }, [pagination.page, language, status]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLanguageChange = (keys: SharedSelection) => {
    setLanguage(keys as Set<string>);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (keys: SharedSelection) => {
    setStatus(keys as Set<string>);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const selectedBoxIds = useMemo(() => {
    if (selectedKeys === 'all') {
      return boxes.map(box => box.id);
    }
    return Array.from(selectedKeys);
  }, [selectedKeys, boxes])

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
      <div className="flex justify-between items-center gap-2">
        <SelectedBoxSyncButton 
          selectedBoxIds={selectedBoxIds}
          reload={() => fetchBoxes(pagination.page)}
        />
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
          <Select
            label="状态"
            selectedKeys={status}
            onSelectionChange={handleStatusChange}
            className="w-32"
            size="sm"
            labelPlacement="outside-left"
          >
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <AllBoxesSyncButton reload={fetchBoxes} />
          <ReloadButton isLoading={loading} reload={() => fetchBoxes(pagination.page)} />
        </div>
      </div>

      <Table 
        aria-label="卡盒列表" 
        selectionMode="multiple"
        color="primary"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
        bottomContent={
          <TableFooter handlePageChange={handlePageChange} pagination={pagination} />
        }
      >
        <TableHeader>
          <TableColumn>发布时间</TableColumn>
          <TableColumn>编号</TableColumn>
          <TableColumn>卡片数量</TableColumn>
          <TableColumn>名称</TableColumn>
          <TableColumn>语言</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
        </TableHeader>
        <TableBody>
          {boxes.map((box) => (
            <TableRow key={box.boxId}>
              <TableCell>{box.publishAt ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.publishAt)) : '-'}</TableCell>
              <TableCell>{box.code}</TableCell>
              <TableCell>{box.count}</TableCell>
              <TableCell>{box.name}</TableCell>
              <TableCell>{box.language}</TableCell>
              <TableCell>
                {
                box.status === 0 
                  ? <Chip color="danger" size="sm" variant="solid">未同步</Chip>
                  : <Chip color="success" size="sm" variant="solid">已同步</Chip>}
              </TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.createdAt))}</TableCell>
              <TableCell>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(box.updatedAt))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
