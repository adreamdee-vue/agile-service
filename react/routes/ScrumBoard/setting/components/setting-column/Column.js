import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { stores, Permission, Choerodon } from '@choerodon/boot';
import { Icon, Input } from 'choerodon-ui';
import { Modal } from 'choerodon-ui/pro';
import './Column.less';
import ScrumBoardStore from '@/stores/project/scrumBoard/ScrumBoardStore';
import TextEditToggle from '@/components/TextEditToggle';
import StatusList from './StatusList';

const { AppState } = stores;
const { Text, Edit } = TextEditToggle;
@observer
class Column extends Component {
  handleDeleteColumn = () => {
    const {
      data, refresh,
    } = this.props;
    Modal.confirm({
      title: '删除列',
      children: '确定要删除该列？',
    }).then((button) => {
      if (button === 'ok') {
        ScrumBoardStore.axiosDeleteColumn(data.columnId).then(() => {
          refresh();
        }).catch((err) => {
        });
      }
    });
  }

  updateColumnMaxMin = (type, value) => {
    const { data: propData, refresh } = this.props;
    const maxNum = type === 'maxNum' ? value : propData.maxNum;
    const minNum = type === 'minNum' ? value : propData.minNum;
    const data = {
      boardId: ScrumBoardStore.getSelectedBoard,
      columnId: propData.columnId,
      objectVersionNumber: propData.objectVersionNumber,
      projectId: AppState.currentMenuType.id,
      maxNum,
      minNum,
    };
    ScrumBoardStore.axiosUpdateMaxMinNum(
      propData.columnId, data,
    ).then((res) => {
      const { failed } = res;
      if (!failed) {
        Choerodon.prompt('设置成功');
        refresh();
      } else {
        Choerodon.prompt(res.message);
      }
    }).catch((error) => {
      Choerodon.prompt(error);
    });
  }

  handleSaveColumnName = (name) => {
    const { data: propData, index } = this.props;
    const data = {
      columnId: propData.columnId,
      objectVersionNumber: propData.objectVersionNumber,
      name,
      projectId: AppState.currentMenuType.id,
      boardId: ScrumBoardStore.getSelectedBoard,
    };
    ScrumBoardStore.axiosUpdateColumn(
      propData.columnId, data, ScrumBoardStore.getSelectedBoard,
    ).then((res) => {
      const originData = ScrumBoardStore.getBoardData;
      originData[index].objectVersionNumber = res.objectVersionNumber;
      originData[index].name = res.name;
      ScrumBoardStore.setBoardData(originData);
    }).catch((error) => {
    });
  }


  renderColumnName = () => {
    const menu = AppState.currentMenuType;
    const {
      data, index, draggabled,
    } = this.props;
    const { type, id: projectId, organizationId: orgId } = menu;
    return (
      <div className="c7n-scrumsetting-columnStatus">
        <Permission
          type={type}
          projectId={projectId}
          organizationId={orgId}
          service={['agile-service.board.deleteScrumBoard']}
          noAccessChildren={data.name}
        >
          <TextEditToggle
            formKey="name"
            onSubmit={this.handleSaveColumnName}
            originData={data.name}
          >
            <Text>
              {text => text}
            </Text>
            <Edit>
              <Input
                autoFocus
              />
            </Edit>
          </TextEditToggle>
        </Permission>
      </div>
    );
  }

  render() {
    const menu = AppState.currentMenuType;
    const {
      data, index, isDragDisabled,
    } = this.props;
    const { type, id: projectId, organizationId: orgId } = menu;

    return (
      <Draggable
        isDragDisabled={isDragDisabled}
        key={data.columnId}
        index={index}
        draggableId={JSON.stringify({
          columnId: data.columnId,
          objectVersionNumber: data.objectVersionNumber,
        })}
        type="columndrop"
      >
        {provided => (
          <div
            className="c7n-scrumsetting-column"
            ref={provided.innerRef}
            {...provided.draggableProps}            
          >
            <div className="c7n-scrumsetting-columnContent">
              <div className="c7n-scrumsetting-columnTop">
                <div>
                  <div
                    className="c7n-scrumsetting-icons"
                  >
                    <Icon
                      type="open_with"
                      style={{
                        cursor: 'move',
                        display: isDragDisabled && 'none',
                      }}
                      {...provided.dragHandleProps}
                    />
                    <Icon
                      type="delete"
                      style={{
                        cursor: 'pointer',
                        display: isDragDisabled && 'none',
                      }}
                      role="none"
                      onClick={this.handleDeleteColumn.bind(this)}
                    />
                  </div>
                </div>
                {this.renderColumnName()}
                <div
                  className="c7n-scrumsetting-columnBottom"
                  style={{
                    borderBottom: data.color ? `3px solid ${data.color}` : '3px solid rgba(0,0,0,0.26)',
                  }}
                >
                  <div
                    style={{
                      visibility: ScrumBoardStore.getCurrentConstraint === 'constraint_none' ? 'hidden' : 'visible',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Permission
                      type={type}
                      projectId={projectId}
                      organizationId={orgId}
                      service={['agile-service.project-info.updateProjectInfo']}
                      noAccessChildren={(
                        <span
                          style={{ minWidth: '110px' }}
                        >
                          {'最大值：'}
                          {typeof data.maxNum === 'number' ? data.maxNum : '没有最大'}
                        </span>
                            )}
                    >
                      <TextEditToggle
                        formKey="name"
                        onSubmit={(value) => {
                          this.updateColumnMaxMin('maxNum', value);
                        }}
                        originData={data.maxNum}
                      >
                        <Text>
                          {text => (
                            <span
                              style={{ cursor: 'pointer', minWidth: '110px' }}
                            >
                              {'最大值：'}
                              {typeof text === 'number' ? text : '没有最大'}
                            </span>
                          )}
                        </Text>
                        <Edit>
                          <Input
                            autoFocus
                          />
                        </Edit>
                      </TextEditToggle>
                    </Permission>
                    <Permission
                      type={type}
                      projectId={projectId}
                      organizationId={orgId}
                      service={['agile-service.project-info.updateProjectInfo']}
                      noAccessChildren={(
                        <span
                          style={{ minWidth: '110px' }}
                        >
                          {'最小值：'}
                          {typeof data.minNum === 'number' ? data.minNum : '没有最小'}
                        </span>
                            )}
                    >
                      <TextEditToggle
                        formKey="name"
                        onSubmit={(value) => {
                          this.updateColumnMaxMin('minNum', value);
                        }}
                        originData={data.minNum}
                      >
                        <Text>
                          {text => (
                            <span
                              style={{ cursor: 'pointer', minWidth: '110px' }}
                            >
                              {'最小值：'}
                              {typeof text === 'number' ? text : '没有最小'}
                            </span>
                          )}
                        </Text>
                        <Edit>
                          <Input
                            autoFocus
                          />
                        </Edit>
                      </TextEditToggle>
                    </Permission>
                  </div>
                </div>
              </div>
              <Permission
                type={type}
                projectId={projectId}
                organizationId={orgId}
                service={['agile-service.issue-status.moveStatusToColumn']}
                noAccessChildren={(
                  <StatusList data={data} isDragDisabled />
                )}
              >
                <StatusList data={data} />
              </Permission>
            </div>
          </div>
        )}
      </Draggable>
    );
  }
}

export default Column;
