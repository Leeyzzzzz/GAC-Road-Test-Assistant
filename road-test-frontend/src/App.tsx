import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Breadcrumb,
  Tree,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select
} from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  TagsOutlined,
  PlusOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType, DataNode } from 'antd/es/table';
import {
  projectApi,
  worksheetApi,
  categoryApi,
  testCaseApi
} from './services/api';
import type {
  Project,
  Worksheet,
  Category,
  TestCase as TestCaseType,
  TestCaseCreate,
  TestCaseUpdate
} from './types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [breadcrumbItems, setBreadcrumbItems] = useState([
    { title: <><HomeOutlined /> 首页</> }
  ]);

  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<number | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCaseType | null>(null);
  const [form] = Form.useForm();

  const columns: ColumnsType<TestCaseType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用例标题',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        const priorityMap: Record<number, string> = {
          1: 'P0 - 紧急',
          2: 'P1 - 高',
          3: 'P2 - 中',
          4: 'P3 - 低'
        };
        const colorMap: Record<number, string> = {
          1: 'red',
          2: 'orange',
          3: 'blue',
          4: 'default'
        };
        return <Tag color={colorMap[priority || 4]}>{priorityMap[priority || 4]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTestCase(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTestCase(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getProjects();
      if (response.data.code === 0) {
        setProjects(response.data.data);
        message.success('项目列表加载成功！');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorksheets = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await worksheetApi.getWorksheets(projectId);
      if (response.data.code === 0) {
        setWorksheets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch worksheets:', error);
      message.error('加载工作表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (projectId: number, worksheetId: number) => {
    setLoading(true);
    try {
      const response = await categoryApi.getCategories(projectId, worksheetId);
      if (response.data.code === 0) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      message.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestCases = async (projectId: number, worksheetId: number) => {
    setLoading(true);
    try {
      const categories = await categoryApi.getCategories(projectId, worksheetId);
      if (categories.data.code === 0 && categories.data.data.length > 0) {
        const defaultCategoryId = categories.data.data[0].id;
        const response = await testCaseApi.getTestCases({ category_id: defaultCategoryId });
        if (response.data.code === 0) {
          setTestCases(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
      message.error('加载测试用例失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const buildTree = () => {
      const nodes: DataNode[] = projects.map(p => ({
        title: p.name,
        key: `project-${p.id}`,
        icon: <FolderOutlined />,
        children: worksheets.map(w => ({
          title: w.name,
          key: `project-${p.id}-worksheet-${w.id}`,
          icon: <FileTextOutlined />,
        }))
      }));
      setTreeData(nodes);
    };
    buildTree();
  }, [projects, worksheets]);

  const onSelect = (selectedKeys: React.Key[]) => {
    setSelectedKeys(selectedKeys as string[]);
    const key = selectedKeys[0] as string;
    const keyParts = key.split('-');

    if (key.startsWith('project-') && keyParts.length === 2) {
      const projectId = parseInt(keyParts[1]);
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setBreadcrumbItems([
          { title: <><HomeOutlined /> 首页</> },
          { title: project.name }
        ]);
      }
      setCurrentProjectId(projectId);
      setCurrentWorksheetId(null);
      setTestCases([]);
      fetchWorksheets(projectId);
    } else if (key.startsWith('project-') && keyParts.length === 4) {
      const projectId = parseInt(keyParts[1]);
      const worksheetId = parseInt(keyParts[3]);
      const project = projects.find(p => p.id === projectId);
      const worksheet = worksheets.find(w => w.id === worksheetId);
      if (project && worksheet) {
        setBreadcrumbItems([
          { title: <><HomeOutlined /> 首页</> },
          { title: project.name },
          { title: worksheet.name }
        ]);
      }
      setCurrentProjectId(projectId);
      setCurrentWorksheetId(worksheetId);
      fetchCategories(projectId, worksheetId);
      fetchTestCases(projectId, worksheetId);
    }
  };

  const onExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  const handleCreateTestCase = () => {
    if (!currentWorksheetId || categories.length === 0) {
      message.warning('请先选择一个工作表');
      return;
    }
    const defaultCategoryId = categories[0].id;
    setEditingCase(null);
    form.resetFields();
    form.setFieldsValue({ category: defaultCategoryId });
    setModalVisible(true);
  };

  const handleEditTestCase = (testCase: TestCaseType) => {
    setEditingCase(testCase);
    form.setFieldsValue(testCase);
    setModalVisible(true);
  };

  const handleDeleteTestCase = async (caseId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个测试用例吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await testCaseApi.deleteTestCase(caseId);
          message.success('删除成功');
          if (currentProjectId && currentWorksheetId) {
            fetchTestCases(currentProjectId, currentWorksheetId);
          }
        } catch (error) {
          console.error('Failed to delete test case:', error);
          message.error('删除失败');
        }
      }
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const caseData = {
        summary: values.summary,
        category: values.category,
        priority: values.priority || 3,
        case_status: 1,
        text: values.text || '',
        setup: values.setup || '',
        breakdown: values.breakdown || ''
      };
      
      if (editingCase) {
        await testCaseApi.updateTestCase(editingCase.id, caseData as TestCaseUpdate);
        message.success('更新成功');
      } else {
        await testCaseApi.createTestCase(caseData as TestCaseCreate);
        message.success('创建成功');
      }
      setModalVisible(false);
      if (currentProjectId && currentWorksheetId) {
        fetchTestCases(currentProjectId, currentWorksheetId);
      }
    } catch (error) {
      console.error('Failed to save test case:', error);
      message.error('保存失败');
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
        }}>
          {!collapsed && (
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              🚗 路测助手
            </Title>
          )}
          {collapsed && <Title level={4} style={{ color: 'white', margin: 0 }}>🚗</Title>}
        </div>
        <div style={{ padding: '16px' }}>
          <Spin spinning={loading}>
            {treeData.length > 0 ? (
              <Tree
                showIcon
                defaultExpandAll={false}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={onExpand}
                onSelect={onSelect}
                treeData={treeData}
              />
            ) : (
              <Text type="secondary">加载中...</Text>
            )}
          </Spin>
        </div>
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Breadcrumb items={breadcrumbItems} />
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTestCase}
              disabled={!currentWorksheetId}
            >
              新建用例
            </Button>
            <Button disabled>导入</Button>
            <Button disabled>导出</Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Spin spinning={loading}>
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0 }}>
                  📋 测试用例列表
                </Title>
                <Text type="secondary">共 {testCases.length} 条用例</Text>
              </div>
              <Table
                columns={columns}
                dataSource={testCases}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </div>
          </Spin>
        </Content>
      </Layout>

      <Modal
        title={editingCase ? '编辑测试用例' : '新建测试用例'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 3
          }}
        >
          <Form.Item
            name="summary"
            label="用例标题"
            rules={[{ required: true, message: '请输入用例标题' }]}
          >
            <Input placeholder="请输入用例标题（如：ODC边界识别-直道场景）" />
          </Form.Item>

          <Form.Item name="category" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select placeholder="请选择优先级">
              <Option value={1}>P0 - 紧急</Option>
              <Option value={2}>P1 - 高</Option>
              <Option value={3}>P2 - 中</Option>
              <Option value={4}>P3 - 低</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="setup"
            label="前置条件"
          >
            <TextArea rows={2} placeholder="测试前置条件（如：车辆准备、环境准备等）" />
          </Form.Item>

          <Form.Item
            name="text"
            label="测试步骤"
          >
            <TextArea rows={6} placeholder="详细测试步骤（如：1. 启动车辆；2. 加速到60km/h；...）" />
          </Form.Item>

          <Form.Item
            name="breakdown"
            label="预期结果"
          >
            <TextArea rows={2} placeholder="预期结果（如：车辆成功识别边界并减速）" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;
