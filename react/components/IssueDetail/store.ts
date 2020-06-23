import { observable, action, computed } from 'mobx';
import type { Events } from './index';

export enum IssueEvents {
  update = 'update',
  delete = 'delete',
  clone = 'clone'
}

class IssueDetailStore {
  loading: boolean = false;

  selectedMap = observable.map();

  @action
  select(issueId: number) {
    if (!this.selectedMap.has(issueId)) {
      this.selectedMap.clear();
      this.selectedMap.set(issueId, true);
    }
  }

  @action
  unSelect(issueId: number) {
    this.selectedMap.delete(issueId);
  }

  @action
  close() {
    this.selectedMap.clear();
  }

  @computed get visible() {
    return this.selectedMap.size > 0;
  }

  @computed get selected() {
    return [...this.selectedMap.keys()][0];
  }

  events = {} as Events

  initEvents(events: Events) {
    this.events = events;
  }

  fireEvent(eventKey: IssueEvents, payload: any) {
    if (this.events[eventKey]) {
      this.events[eventKey].call(null, payload);
    }
  }
}
export { IssueDetailStore };
export default new IssueDetailStore();
