import React from 'react';
import { Select, CheckBox } from 'choerodon-ui/pro';
import { Icon } from 'choerodon-ui';
import { observer } from 'mobx-react-lite';
import to, { linkUrl } from '@/utils/to';
import LINK_URL, { LINK_URL_TO } from '@/constants/LINK_URL';
import { LabelLayout } from 'choerodon-ui/pro/lib/form/enum';
import seeChangeRange from './image/seeChangeRange.svg';
import seeProgress from './image/seeProgress.svg';
import styles from './index.less';

export interface IEpic {
  issueId: string,
  epicName: string,
  issueNum: string,
  summary: string,
}
export interface EpicBurnDownSearchProps {
  epics: IEpic[]
  epicIsLoading: boolean,
  checked: 'checked' | undefined,
  currentEpicId: string,
  setCurrentEpicId: Function,
  setChecked: Function,
}

const { Option } = Select;

const EpicBurnDownSearch:React.FC<EpicBurnDownSearchProps> = ({
  epics, epicIsLoading, checked, currentEpicId, setCurrentEpicId, setChecked,
}) => {
  const handleChangeCurrentEpic = (epicId: string) => {
    setCurrentEpicId(epicId);
  };

  const handleCheckedChange = (value: 'checked' | undefined) => {
    setChecked(value);
  };

  const handleIconMouseEnter = () => {
    const iconShowInfo = document.getElementsByClassName(styles.icon_show_info)[0];
    // @ts-ignore
    iconShowInfo.style.display = 'flex';
  };

  const handleIconMouseLeave = () => {
    const iconShowInfo = document.getElementsByClassName(styles.icon_show_info)[0];
    // @ts-ignore
    iconShowInfo.style.display = 'none';
  };

  const handleLinkToIssue = (linkType: string, item: IEpic) => {
    if (JSON.stringify(item) !== '{}') {
      if (linkType === 'epic') {
        LINK_URL_TO.issueLinkTo(item.issueId, item.issueNum);
        return;
      }
      to(LINK_URL.workListIssue);
    }
  };

  const renderEpicInfo = () => {
    if (currentEpicId !== undefined) {
      const currentEpic = epics.find((item) => item.issueId === currentEpicId);
      return (
        <p className={styles.epicInfo}>
          <span
            className={styles.primary}
            style={{
              cursor: 'pointer',
            }}
            role="none"
            onClick={handleLinkToIssue.bind(this, 'epic', currentEpicId !== undefined ? epics.filter((item) => item.issueId === currentEpicId)[0] : {})}
          >
            {`${currentEpic ? currentEpic.issueNum : ''}`}
          </span>
          <span>{` ${currentEpic ? currentEpic.summary : ''}`}</span>
        </p>
      );
    }
    return '';
  };

  return (
    <>
      {
      (epics.length > 0 && !epicIsLoading) && (
        <div className={styles.epicBurnDown_search}>
          <div style={{ display: 'flex' }}>
            <Select
              className={styles.epicBurnDown_search_select}
              labelLayout={'float' as LabelLayout}
              clearButton={false}
              style={{ width: 500, marginRight: 33, height: 36 }}
              label="史诗"
              value={currentEpicId}
              onChange={handleChangeCurrentEpic}
              // @ts-ignore
              getPopupContainer={((triggerNode) => triggerNode.parentNode)}
            >
              {
                epics.map((epic) => (
                  <Option key={epic.issueId} value={epic.issueId}>{epic.epicName}</Option>
                ))
              }
            </Select>
            <div className={styles.epicSelect}>
              <CheckBox
                label="查看选项"
                value="checked"
                checked={checked === 'checked'}
                onChange={handleCheckedChange}
              >
                根据图表校准冲刺
              </CheckBox>
              <span className={styles.icon_show} role="none" onMouseEnter={handleIconMouseEnter} onMouseLeave={handleIconMouseLeave}>
                <Icon type="help icon" />
              </span>

              <div className={styles.icon_show_info} onMouseEnter={handleIconMouseEnter} onMouseLeave={handleIconMouseLeave}>
                <figure className={styles.icon_show_progress}>
                  <div className={styles.icon_show_info_svg}>
                    <img src={seeProgress} alt="查看进度" />
                  </div>
                  <figcaption className={styles.icon_show_info_detail}>
                    <p className={styles.icon_show_info_detail_header}>查看进度</p>
                    <p className={styles.icon_show_info_detail_content}>按照史诗查看冲刺进度</p>
                  </figcaption>
                </figure>
                <figure>
                  <div className="icon_show_info_svg">
                    <img src={seeChangeRange} alt="查看变更范围" />
                  </div>
                  <figcaption className={styles.icon_show_info_detail}>
                    <p className={styles.icon_show_info_detail_header}>查看变更范围</p>
                    <p className={styles.icon_show_info_detail_content}>跟踪范围的扩大和缩小，由底部条状信息显示。</p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
          <div>
            {renderEpicInfo()}
          </div>
        </div>
      )
    }
    </>
  );
};

export default observer(EpicBurnDownSearch);
