import {
  observable, action, computed,
} from 'mobx';
import { stores } from '@choerodon/boot';
import Moment from 'moment';
import { extendMoment } from 'moment-range';
import { getCurrentPiInfo, getCurrentPiAllSprint } from '@/api/SprintApi.js';
import { getProjectsInProgram, getProjectIsShowFeature } from '../../../api/CommonApi';

const moment = extendMoment(Moment);
const { AppState } = stores;
/**
 * @param isInProgram 判断项目是否在项目群中
 * @param isShowFeature 判断项目是否显示特性 需先使用loadIsShowFeature 
 */
class IsInProgramStore {
  @observable isInProgram = false;

  @observable program = false;

  @observable isShowFeature = false; // 判断是否可以展示特性字段

  @observable artInfo = {};

  @observable piInfo = {};

  @observable sprints = []; // 用于时间判断

  /**
   * 寻找冲刺中接近时间data最小范围
   * @param {*} data 
   * @param {*} sprintId 自身冲刺id
   */
  findDateMinRange(data, sprintId) {
    let minDate = null;
    const startDates = this.sprints.filter(sprint => sprint.sprintId !== sprintId && moment(sprint.startDate).isBefore(data)).map(item => item.endDate);
    const sprintDate = sprintId && this.sprints.find(sprint => sprint.sprintId === sprintId);

    if (startDates.length !== 0) {
      // eslint-disable-next-line prefer-destructuring
      minDate = startDates[0];
      startDates.forEach((startDate) => {
        if (sprintDate) {
          if (!moment(startDate).isBetween(sprintDate.startDate, sprintDate.endDate, null, '()') && moment(startDate).isAfter(moment(minDate))) {
            minDate = moment(startDate);
          }
        } else if (moment(startDate).isAfter(moment(minDate))) {
          minDate = moment(startDate);
        }
      });
    }
    return minDate;
  }


  /**
   * 寻找冲刺中接近时间data最大范围
   * @param {*} data 
   * @param {*} sprintId 自身冲刺id
   */
  findDateMaxRange(data, sprintId) {
    let maxDate = null;
    const startDates = this.sprints.filter(sprint => sprint.sprintId !== sprintId && moment(sprint.startDate).isAfter(data)).map(item => item.startDate);
    const sprintDate = sprintId && this.sprints.find(sprint => sprint.sprintId === sprintId);
    if (startDates.length !== 0) {
      // eslint-disable-next-line prefer-destructuring
      maxDate = startDates[0];
      startDates.forEach((startDate) => {
        if (sprintDate) {
          if (!moment(startDate).isBetween(sprintDate.startDate, sprintDate.endDate, null, '()') && moment(startDate).isBefore(moment(maxDate))) {
            maxDate = moment(startDate);
          }
        } else if (moment(startDate).isBefore(moment(maxDate))) {
          maxDate = moment(startDate);
        }
      });
    }
    return maxDate;
  }

  /**
   * 判断这个时间是否在冲刺时间范围内
   * @param {*} startDate 
   * @param {*} endDate 
   * @param {*} sprintId 自身冲刺id
   */
  stopChooseBetween(time, sprintId) {
    // const date = time.format('YYYY-MM-DD HH:mm:ss');
    let sprints = this.sprints.filter(sprint => sprint.sprintId !== sprintId);
    sprints = sprints.map((item) => {
      let isPiStart = false;
      let isPiEnd = false;
      if (moment(item.startDate).isSame(this.getPiInfo.actualStartDate || this.getPiInfo.sprintDate)) {
        isPiStart = true;
      }
      if (moment(item.endDate).isSame(this.piInfo.endDate)) {
        isPiEnd = true;
      }
      const result = sprints.find(sprint => sprint.startDate === item.endDate);
      if (result) {
        return ({
          startDate: item.startDate,
          endDate: result.endDate,
          isPiStart,
          isPiEnd,
        });
      } else {
        return ({
          startDate: item.startDate,
          endDate: item.endDate,
          isPiStart,
          isPiEnd,
        });
      }
    });
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < sprints.length; index++) {
      const startDate = moment(sprints[index].startDate);
      const endDate = moment(sprints[index].endDate);
      const endDateZero = moment(sprints[index].endDate).hour(0).minute(0).second(0);
      if (moment(time).isBetween(startDate, endDate, null, '()')) {
        return true;
      }
      if (sprints[index].isPiStart && moment(time).isSame(sprints[index].startDate)) {
        return true;
      }
      if (sprints[index].isPiEnd && moment(time).isSame(sprints[index].endDate)) {
        return true;
      }
      // else if (moment(time).isBetween(endDateZero, endDate, null, '()')) {
      //   return true;
      // }
    }

    return false;
  }

  refresh = () => {
    if (AppState.currentMenuType.type === 'project') {
      getProjectsInProgram().then((program) => {
        // console.log(program);
        this.setIsInProgram(Boolean(program));
        this.setProgram(program);
      });
    }
  }

  loadIsShowFeature = () => getProjectIsShowFeature().then((res) => {
    this.setIsShowFeature(Boolean(res));
    this.setArtInfo(res);
    return Boolean(res);
  })

  loadPiInfoAndSprint = async (programId = this.artInfo.programId, artId = this.artInfo.id) => {
    const currentPiInfo = await getCurrentPiInfo(programId, artId);
    if (currentPiInfo.id) {
      const sprints = await getCurrentPiAllSprint(currentPiInfo.id);
      this.setPiInfo(currentPiInfo);
      this.setSprints(sprints.map(sprint => ({
        ...sprint,
        endDate: sprint.actualEndDate || sprint.endDate,
      })));
    }
  }


  @action setPiInfo(data) {
    this.piInfo = data;
  }

  @computed get getPiInfo() {
    return this.piInfo;
  }

  @action setSprints(data) {
    this.sprints = data;
  }

  @computed get getSprints() {
    return this.sprints.slice();
  }

  @action setArtInfo(data) {
    this.artInfo = data;
  }

  @computed get getArtInfo() {
    return this.artInfo;
  }


  @action setIsInProgram(isInProgram) {
    this.isInProgram = isInProgram;
  }

  @action setProgram(program) {
    this.program = program;
  }

  @computed get getIsInProgram() {
    return this.isInProgram;
  }

  @action setIsShowFeature(data) {
    this.isShowFeature = data;
  }

  @computed get getIsShowFeature() {
    return this.isShowFeature;
  }

  // 时间点是否在pi内
  isDateBetweenPiDate(date) {
    const { actualStartDate: piActualStartDate, endDate: piEndDate } = this.getPiInfo;
    return date.isBetween(piActualStartDate, piEndDate);
  }

  // 时间点是否在其他冲刺中
  isDateBetweenOtherSprints(date, sprintId) {
    return this.sprints.filter(sprint => sprint.sprintId !== sprintId).some((sprint) => {
      const { startDate } = sprint;
      const endDate = sprint.actualEndDate || sprint.endDate;
      return date.isBetween(startDate, endDate);
    });
  }

  // 时间段是否在pi中
  isRangeInPi(startDate, endDate) {
    const { actualStartDate: piActualStartDate, endDate: piEndDate } = this.getPiInfo;
    const piRange = moment.range(piActualStartDate, piEndDate);
    // 开始时间和结束时间都在pi内
    return piRange.contains(startDate) && piRange.contains(endDate);
  }

  // 时间段是否和其他冲刺有重叠
  isRangeOverlapWithOtherSprints(startDate, endDate, sprintId) {
    return this.sprints.filter(sprint => sprint.sprintId !== sprintId).some((sprint) => {
      const { startDate: sprintStartDate } = sprint;
      const sprintEndDate = sprint.actualEndDate || sprint.endDate;
      const sprintRange = moment.range(sprintStartDate, sprintEndDate);
      const range = moment.range(startDate, endDate);
      return range.overlaps(sprintRange);
    });
  }

  
  // 开始时间应小于结束时间
  isRange(startDate, endDate) {
    return startDate < endDate;
  }

  // 时间能不能选
  dateCanChoose(date, sprintId) {
  // 首先时间应该在PI的实际开始时间和结束时间之间
  // 并且不能在其他冲刺之间
    return this.isDateBetweenPiDate(date) && !this.isDateBetweenOtherSprints(date, sprintId);
  }

  // 时间段是不是可以选
  rangeCanChoose(startDate, endDate, sprintId) {
    // 时间段要在pi内部
    // 时间段不能和其他冲刺重叠
    return this.isRange(startDate, endDate) && this.isRangeInPi(startDate, endDate) && !this.isRangeOverlapWithOtherSprints(startDate, endDate, sprintId);
  }
}


export default new IsInProgramStore();
