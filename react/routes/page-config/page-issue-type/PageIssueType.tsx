import React, {
  useState, useEffect, useReducer, useCallback,
} from 'react';
import {
  TabPage as Page, Header, Content, Breadcrumb,
} from '@choerodon/boot';
import {
  Button, SelectBox, Modal, Spin,
} from 'choerodon-ui/pro/lib';
import { FuncType, ButtonColor } from 'choerodon-ui/pro/lib/button/enum';
import { ViewMode } from 'choerodon-ui/pro/lib/radio/enum';
import WYSIWYGEditor from '@/components/WYSIWYGEditor';
import WYSIWYGViewer from '@/components/WYSIWYGViewer';
import { observer, useObservable } from 'mobx-react-lite';
import { pageConfigApi, PageConfigIssueType, IFiledProps } from '@/api/PageConfig';
import { beforeTextUpload, text2Delta } from '@/utils/richText';
import styles from './index.less';
import IssueTypeWrap from './components/issue-type-wrap';
import SortTable from './components/sort-table';
import openAddFiled from './components/add-filed';
import { usePageIssueTypeStore } from './stores';
import Switch from './components/switch';
import './PageIssueType.less';
import CreateField from '../components/create-field';

interface DescriptionState {
  id?: string,
  template: string,
  objectVersionNumber?: number,
}
type DescriptionAction = Required<{ type: string }> & Partial<DescriptionState>

interface IssueTypeState {
  current: string,
  newCurrent: string,
}
type IssueTypeAction = Required<{ type: string }> & Partial<IssueTypeState>

const preCls = 'c7n-agile-page-config-page-issue-type';
const { Option } = SelectBox;
function PageIssueType() {
  const { sortTableDataSet, intl } = usePageIssueTypeStore();
  const [edit, setEdit] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>(true);
  const [newFields, setNewFields] = useState<Array<any>>([]);
  const [deleteIds, setDeleteIds] = useState<Array<string>>([]);
  const dataStatus = useObservable({ code: '' }); // 是否有更改内容
  const [issueTypeState, setIssueTypeState] = useReducer(
    (state: IssueTypeState, action: IssueTypeAction) => {
      switch (action.type) {
        case 'change':
          if (edit && (dataStatus.code === 'update' || dataStatus.code === 'drag_update')) {
            console.log('state');
            return {
              current: state.current,
              newCurrent: action.newCurrent,
            };
          }
          return {
            current: action.newCurrent,
            newCurrent: action.newCurrent,
          };
        default:
          return state;
      }
    }, {
      current: 'feature',
      newCurrent: 'feature',
    },
  );
  const [desState, setDesState] = useReducer(
    (state: DescriptionState, action: DescriptionAction) => {
      switch (action.type) {
        case 'init':
          return ({
            id: action.id,
            template: action.template,
            objectVersionNumber: action.objectVersionNumber,
          });
        case 'change':
          return {
            ...state,
            template: action.template,
          };
        case 'destroy':
          return {
            id: undefined,
            template: '',
            objectVersionNumber: undefined,
          };
        default:
          return state;
      }
    }, {
      id: undefined,
      template: undefined,
      objectVersionNumber: undefined,
    },
  );

  async function handleSubmit() {
    setLoading(true);
    if (dataStatus.code === 'update' || dataStatus.code === 'drag_update') {
      let submitData: Array<any> = [];
      if (sortTableDataSet.dirty) {
        submitData = sortTableDataSet.filter((record) => record.dirty);
      }
      const data = {
        issueType: issueTypeState.current as PageConfigIssueType,
        // fields: submitData,
        fields: submitData.map((item) => ({
          fieldId: item.get('fieldId'),
          required: item.get('required'),
          created: item.get('created'),
          edited: item.get('edited'),
          objectVersionNumber: item.get('objectVersionNumber'),
        })),
        issueTypeFieldVO: desState.id || desState.template ? {
          id: desState.id,
          template: desState.template,
          objectVersionNumber: desState.objectVersionNumber,
        } : undefined,
        // createdFields: newFields,
        deleteIds,
      };
      console.log('submitData', desState, submitData); // beforeTextUpload
      const desObj = { description: undefined };
      if (desState.template) {
        beforeTextUpload(text2Delta(desState.template), data.issueTypeFieldVO!, () => {
          pageConfigApi.update(data).then(() => {
            destroyData();
            loadData();
          });
        }, 'template');
      }
      console.log('desObj:', desObj, data);
    }
    return true;
  }
  const loadData = () => {
    setLoading(true);
    pageConfigApi.loadByIssueType(issueTypeState.current as PageConfigIssueType).then((res) => {
      sortTableDataSet.loadData(res.fields);
      res.issueTypeFieldVO && setDesState({ ...res.issueTypeFieldVO, type: 'init' });
      setLoading(false);
    });
  };
  useEffect(() => {

  }, []);
  const destroyData = () => {
    setDesState({ type: 'destroy' });
    dataStatus.code = '';
    edit && setEdit(false);
  };

  const handleSwitch = () => {
    destroyData();
    loadData();
  };
  const handleCancel = () => {
    destroyData();
    loadData();
    // sortTableDataSet.reset();
  };
  useEffect(() => {
    handleSwitch();
  }, [issueTypeState.current]);

  const handleSelectBox = (val: any) => {
    if (edit && (dataStatus.code === 'update' || dataStatus.code === 'drag_update')) {
      Modal.confirm({
        title: '是否放弃更改？',
        children: (
          <div>
            页面有未保存的内容，切换则放弃更改
          </div>
        ),
        onOk: () => handleSwitch(),
      });
    } else {
      console.log('handleSwitch');
    }
    setIssueTypeState({ type: 'change', newCurrent: val });
  };
  const handleChangeDes = (val: string) => {
    dataStatus.code = 'update';
    setDesState({ type: 'change', template: val });
  };
  const handleDeleteFiled = async (data: IFiledProps) => {
    setLoading(true);
    setDeleteIds(deleteIds.concat([data.id]));
  };
  useEffect(() => {
    deleteIds.length !== 0 && sortTableDataSet.loadData(sortTableDataSet.toData()
      .filter((item: IFiledProps) => item.id !== deleteIds[deleteIds.length - 1]));
    setLoading(false);
  }, [deleteIds]);
  const onSubmitLocal = (data: any) => {
    const newArr = newFields.concat([Object.assign(data, { local: true })]);
    setNewFields(newArr);
    return true;
  };
  const checkCodeOrName = (key: string,
    name: string) => newFields && newFields.length !== 0
    && newFields.some((item) => item[key].trim() === name);
  function openCreateFieldModal() {
    const values = {
      formatMessage: intl.formatMessage,
      schemeCode: 'agile_issue',
      handleRefresh: loadData,
      onSubmitLocal,
      localCheckCode: async (str: string) => !!checkCodeOrName('code', str),
      localCheckName: async (str: string) => !!checkCodeOrName('name', str),
    };
    Modal.open({
      key: Modal.key('create'),
      title: intl.formatMessage({ id: 'field.create' }),
      drawer: true,
      children: <CreateField {...values} />,
      style: { width: 740 },
      okText: intl.formatMessage({ id: 'save' }),
      cancelText: intl.formatMessage({ id: 'cancel' }),
    });
  }
  return (
    <Page
      service={[
        'choerodon.code.project.setting.page.ps.scheme',
      ]}
    >
      <Header>
        {
          edit ? [<Button icon="playlist_add" onClick={openCreateFieldModal}>创建字段</Button>,
            <Button icon="add" onClick={openAddFiled}>添加已有字段</Button>]
            : (
              <Button
                icon="mode_edit"
                onClick={() => {
                  setEdit(true);
                }}
              >
                编辑模版
              </Button>
            )

        }
      </Header>
      <Breadcrumb />
      <Content className={`${preCls}-content`} style={{ overflowY: edit ? 'hidden' : 'auto' }}>
        <SelectBox mode={'button' as ViewMode} defaultValue="feature" value={issueTypeState.current} onChange={handleSelectBox} className={`${preCls}-select-box`}>
          <Option value="issue_epic">史诗</Option>
          <Option value="feature">特性</Option>
          <Option value="story">故事</Option>
          <Option value="task">任务</Option>
          <Option value="sub_task">子任务</Option>
          <Option value="bug">缺陷</Option>
          <Option value="backlog">需求</Option>
        </SelectBox>
        <Spin className="c7n-im" spinning={loading}>
          <div className={styles.top}>
            <IssueTypeWrap title="字段配置">
              <SortTable
                disabled={!edit}
                dataStatus={dataStatus}
                onDelete={handleDeleteFiled}
              />
            </IssueTypeWrap>
            <IssueTypeWrap title="描述信息格式">
              {edit ? (
                <WYSIWYGEditor
                  style={{ height: '100%' }}
                  onChange={handleChangeDes}
                  value={text2Delta(desState.template)}
                  placeholder="您可以在此自定义描述信息格式"
                />
              )
                : <WYSIWYGViewer data={desState.template || ''} />}
            </IssueTypeWrap>
          </div>
        </Spin>

        <div className={styles.bottom} style={{ display: edit ? 'block' : 'none' }}>
          <Button
            funcType={'raised' as FuncType}
            color={'primary' as ButtonColor}
            onClick={handleSubmit}
          >
            确定
          </Button>
          <Button
            funcType={'raised' as FuncType}
            onClick={handleCancel}
          >
            取消
          </Button>

        </div>

      </Content>
    </Page>
  );
}
export default observer(PageIssueType);
